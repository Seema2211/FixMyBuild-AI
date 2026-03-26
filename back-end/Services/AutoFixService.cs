using System.Text;
using FixMyBuildApi.Constants;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services.Providers;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Services;

public class AutoFixService : IAutoFixService
{

    private readonly AppDbContext _db;
    private readonly IEnumerable<IVcsProvider> _providers;
    private readonly ISubscriptionService _subscriptionService;
    private readonly IFeedbackService _feedbackService;

    public AutoFixService(AppDbContext db, IEnumerable<IVcsProvider> providers,
        ISubscriptionService subscriptionService, IFeedbackService feedbackService)
    {
        _db = db;
        _providers = providers;
        _subscriptionService = subscriptionService;
        _feedbackService = feedbackService;
    }

    public async Task<AutoFixResult> RunAsync(
        PipelineFailure failure,
        AIAnalysis? analysis,
        Guid orgId,
        bool forceCreate = false,
        CancellationToken ct = default)
    {
        // ── Guard: need repo coordinates ────────────────────────────────
        if (string.IsNullOrWhiteSpace(failure.RepoOwner) || string.IsNullOrWhiteSpace(failure.RepoName))
            return new AutoFixResult(null, false, "No repository owner/name on failure record");

        // ── Plan limit: AutoPr feature is Pro/Business only ──────────────
        // Skip when orgId is unknown (legacy config-based monitor path).
        if (orgId != Guid.Empty)
        {
            try { await _subscriptionService.EnforceLimitAsync(orgId, LimitType.AutoPr); }
            catch (PlanLimitException ex)
            {
                return new AutoFixResult(null, false, $"Plan limit: {ex.LimitName} not available on {ex.CurrentPlan} plan");
            }
        }

        // ── Build effective analysis from stored failure data if not provided ─
        var eff = analysis ?? new AIAnalysis
        {
            RootCause    = failure.RootCause,
            FixSuggestion = failure.FixSuggestion,
            ErrorSummary = failure.ErrorSummary ?? failure.Explanation,
            FailedStage  = failure.FailedStage ?? "",
            Severity     = failure.Severity ?? "medium",
            Confidence   = failure.Confidence,
            Category     = failure.Category ?? "",
            KeyErrorLines = failure.KeyErrorLines,
        };

        // ── Confidence gate (bypass for explicit manual trigger) ─────────
        if (!forceCreate && (eff.Confidence < AutoFix.ConfidenceThreshold || string.IsNullOrWhiteSpace(eff.FixSuggestion)))
            return new AutoFixResult(null, false,
                $"Confidence {eff.Confidence}% below threshold or no fix suggestion");

        // ── Look up the org's active VCS source ──────────────────────────
        var source = await _db.PipelineSources
            .Where(s => s.OrganizationId == orgId && s.IsActive && s.AccessToken != "")
            .FirstOrDefaultAsync(ct);

        if (source == null)
            return new AutoFixResult(null, false,
                "No active pipeline source with token found for this org. " +
                "Connect your repository under Configuration → Sources.");

        // ── Resolve provider by the source's provider key ────────────────
        var provider = _providers.FirstOrDefault(p => p.ProviderKey == source.Provider);
        if (provider == null)
            return new AutoFixResult(null, false,
                $"VCS provider '{source.Provider}' is not yet supported for auto-fix");

        var token = source.AccessToken;
        var owner = failure.RepoOwner;
        var repo  = failure.RepoName;

        // ── Step A: Post AI analysis comment on any open PRs ────────────
        bool commentPosted = false;
        if (!string.IsNullOrWhiteSpace(failure.HeadBranch))
        {
            try
            {
                var openPrs = await provider.GetOpenPrsForBranchAsync(owner, repo, token, failure.HeadBranch, ct);
                if (openPrs.Count > 0)
                {
                    var commentBody = BuildPrComment(failure, eff);
                    var (prNum, prUrl) = openPrs[0];
                    await provider.PostCommentAsync(owner, repo, token, prNum, commentBody, ct);
                    failure.PrCommentPosted = true;
                    failure.SourcePrNumber  = prNum;
                    failure.SourcePrUrl     = prUrl;
                    commentPosted = true;
                }
            }
            catch { /* best-effort — don't block PR creation */ }
        }

        // ── Step B: Create fix branch + PR ──────────────────────────────
        var suffix     = failure.RunId?.ToString() ?? failure.Id.Split(':').LastOrDefault() ?? Guid.NewGuid().ToString("N")[..8];
        var branchName = $"fixmybuild/fix-{suffix}";
        var fixContent = BuildFixContent(eff.FixSuggestion, eff.KeyErrorLines);

        CreatedPullRequest? pr = null;
        try
        {
            pr = await provider.CreateFixPrAsync(
                owner, repo, token, branchName, fixContent,
                commitMessage : $"fix: {eff.RootCause}",
                prTitle       : $"[FixMyBuild] Fix: {eff.RootCause}",
                prBody        : $"AI-suggested fix (confidence: {eff.Confidence}%).\n\n{eff.ErrorSummary}",
                ct            : ct);

            if (pr != null)
            {
                failure.CreatedPullRequest = pr;

                // ── Record pending feedback for self-learning ────────────────
                // Best-effort: never block the PR creation response
                if (orgId != Guid.Empty)
                {
                    try { await _feedbackService.CreatePendingAsync(failure, eff, pr, orgId, ct); }
                    catch { /* best-effort */ }
                }
            }
        }
        catch { /* best-effort */ }

        return new AutoFixResult(pr, commentPosted);
    }

    // ── Content builders ─────────────────────────────────────────────────

    private static string BuildFixContent(string fixSuggestion, List<string>? keyErrorLines)
    {
        var sb = new StringBuilder($"# Fix suggestion\n\n{fixSuggestion}");
        if (keyErrorLines?.Count > 0)
            sb.Append("\n\n## Key error lines\n```\n")
              .Append(string.Join("\n", keyErrorLines))
              .Append("\n```");
        return sb.ToString();
    }

    private static string BuildPrComment(PipelineFailure failure, AIAnalysis analysis)
    {
        var icon = Severity.Icon(analysis.Severity);

        var sb = new StringBuilder();
        sb.AppendLine("## 🤖 FixMyBuild AI Analysis");
        sb.AppendLine();
        sb.AppendLine($"**Pipeline:** `{failure.PipelineName}`");
        if (!string.IsNullOrWhiteSpace(analysis.FailedStage))
            sb.AppendLine($"**Failed Stage:** `{analysis.FailedStage}`");
        sb.AppendLine($"**Severity:** {icon} {analysis.Severity?.ToUpper() ?? "UNKNOWN"}");
        sb.AppendLine($"**Confidence:** {analysis.Confidence}%");
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine("### 🔍 Root Cause");
        sb.AppendLine(analysis.RootCause);
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(analysis.FixSuggestion))
        {
            sb.AppendLine("### 💡 Suggested Fix");
            sb.AppendLine(analysis.FixSuggestion);
            sb.AppendLine();
        }

        if (analysis.KeyErrorLines?.Count > 0)
        {
            sb.AppendLine("### 🚨 Key Error Lines");
            sb.AppendLine("```");
            foreach (var line in analysis.KeyErrorLines)
                sb.AppendLine(line);
            sb.AppendLine("```");
            sb.AppendLine();
        }

        if (failure.CreatedPullRequest?.HtmlUrl != null)
            sb.AppendLine($"✅ **Auto-fix PR → [{failure.CreatedPullRequest.Title}]({failure.CreatedPullRequest.HtmlUrl})**");

        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine("*Analyzed by [FixMyBuild AI](https://fixmybuild.ai) · AI output — please review before merging.*");

        return sb.ToString();
    }
}
