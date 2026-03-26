using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services.Llm;

namespace FixMyBuildApi.Services;

public class AIAnalyzerService : IAIAnalyzerService
{
    private readonly ILlmProvider         _llm;
    private readonly IFeedbackService     _feedback;
    private readonly ISubscriptionService _subscription;

    // ── Prompt parts — split so history can be injected between instructions and schema ──

    private const string SystemInstructions = @"You are a senior DevOps engineer specializing in CI/CD troubleshooting.

Analyze the provided pipeline logs carefully and determine the actual root cause of failure.

Focus on:
* build errors
* dependency issues
* test failures
* configuration errors
* infrastructure issues
* missing environment variables
* authentication or permission issues

Ignore warnings unless they directly cause the failure.";

    private const string JsonSchema = @"Return structured JSON in this exact format (no markdown, no code fence, no text outside JSON):

{
  ""failed_stage"": """",
  ""error_summary"": """",
  ""root_cause"": """",
  ""category"": ""code | dependency | configuration | infrastructure | test"",
  ""fix_suggestion"": """",
  ""key_error_lines"": [],
  ""severity"": ""low | medium | high"",
  ""confidence"": 0
}

Rules:
* Output valid JSON only
* failed_stage: the pipeline step that failed (e.g. Build, Test, Deploy)
* key_error_lines: array of the most relevant error lines from the log
* fix_suggestion: actionable, specific steps to resolve the issue
* confidence: number 0-100 reflecting how certain you are of the root cause";

    public AIAnalyzerService(
        ILlmProvider llm,
        IFeedbackService feedback,
        ISubscriptionService subscription)
    {
        _llm          = llm;
        _feedback     = feedback;
        _subscription = subscription;
    }

    public async Task<AIAnalysis?> AnalyzeLogsAsync(
        string log,
        Guid? orgId = null,
        CancellationToken cancellationToken = default)
    {
        // ── First pass: base analysis (no history context) ────────
        var result = await RunAnalysisAsync(BuildSystemPrompt(), log, cancellationToken);
        if (result is null) return null;

        // ── Pattern tracking — best-effort, non-blocking ──────────
        if (orgId.HasValue && orgId.Value != Guid.Empty)
        {
            var fingerprint = ErrorFingerprintService.Compute(result.Category, result.KeyErrorLines);
            _ = RecordPatternSilentlyAsync(orgId.Value, result.Category, fingerprint);

            // ── Second pass: augmented analysis for Pro+ orgs ─────
            if (await IsProOrAboveAsync(orgId.Value, cancellationToken))
            {
                var context = await _feedback.GetPromptContextAsync(
                    orgId.Value, result.Category, fingerprint, cancellationToken);

                if (!string.IsNullOrWhiteSpace(context))
                {
                    // Re-run with history injected — fallback to first-pass result if this fails
                    var augmented = await RunAnalysisAsync(
                        BuildSystemPrompt(context), log, cancellationToken);
                    if (augmented is not null)
                        return augmented;
                }
            }
        }

        return result;
    }

    // ── Private helpers ───────────────────────────────────────────

    private async Task<AIAnalysis?> RunAnalysisAsync(
        string systemPrompt, string log, CancellationToken ct)
    {
        var userMessage = $"Pipeline error log to analyze:\n\n{log}";
        var content     = await _llm.CompleteAsync(systemPrompt, userMessage, ct);

        if (string.IsNullOrWhiteSpace(content)) return null;

        try
        {
            var jsonBlock = ExtractJson(content);
            var options   = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<AIAnalysis>(jsonBlock, options);
        }
        catch { return null; }
    }

    /// <summary>
    /// Builds the system prompt, optionally injecting historical context
    /// between the instructions and the JSON schema.
    /// </summary>
    private static string BuildSystemPrompt(string? historicalContext = null)
    {
        var sb = new StringBuilder(SystemInstructions);
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(historicalContext))
        {
            sb.AppendLine();
            sb.AppendLine(historicalContext);
            sb.AppendLine();
            sb.AppendLine("Use the organization history above to inform your analysis.");
            sb.AppendLine("If it aligns with the current failure, reflect that with a higher confidence score and reference the known fix in your suggestion.");
        }

        sb.AppendLine();
        sb.Append(JsonSchema);
        return sb.ToString();
    }

    private async Task<bool> IsProOrAboveAsync(Guid orgId, CancellationToken ct)
    {
        try
        {
            await _subscription.EnforceLimitAsync(orgId, LimitType.Analytics);
            return true;
        }
        catch (PlanLimitException)
        {
            return false;
        }
    }

    /// <summary>Fire-and-forget pattern recording. Never blocks or throws.</summary>
    private async Task RecordPatternSilentlyAsync(Guid orgId, string category, string fingerprint)
    {
        try { await _feedback.RecordPatternOccurrenceAsync(orgId, category, fingerprint); }
        catch { /* best-effort — never block analysis */ }
    }

    private static string ExtractJson(string content)
    {
        content = content.Trim();
        var match = Regex.Match(content, @"\{[\s\S]*\}");
        return match.Success ? match.Value : content;
    }
}
