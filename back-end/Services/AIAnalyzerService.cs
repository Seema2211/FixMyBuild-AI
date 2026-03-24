using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using FixMyBuildApi.Models;
using Microsoft.Extensions.Configuration;

namespace FixMyBuildApi.Services;

public class AIAnalyzerService : IAIAnalyzerService
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    private static readonly string SystemPrompt = @"You are a senior DevOps engineer specializing in CI/CD troubleshooting.

Analyze the provided pipeline logs carefully and determine the actual root cause of failure.

Focus on:
* build errors
* dependency issues
* test failures
* configuration errors
* infrastructure issues
* missing environment variables
* authentication or permission issues

Ignore warnings unless they directly cause the failure.

Return structured JSON in this format only (no markdown, no code fence, no text outside JSON):

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
* Do not include explanations outside JSON
* Extract the most relevant error lines from the log into key_error_lines (array of strings)
* Provide actionable fix suggestions
* failed_stage: the pipeline step that failed (e.g. Build, Test, Deploy)
* confidence: number 0-100";

    public AIAnalyzerService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["OPENAI_API_KEY"] ?? "";
    }

    public async Task<AIAnalysis?> AnalyzeLogsAsync(string log, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey))
            return null;

        var userContent = $"Pipeline error log to analyze:\n\n{log}";

        var body = new
        {
            model = "llama-3.3-70b-versatile",
            messages = new[]
            {
                new { role = "system", content = SystemPrompt },
                new { role = "user", content = userContent }
            },
            temperature = 0.2,
            max_tokens = 1024
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
        request.Headers.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = new StringContent(
            JsonSerializer.Serialize(body),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var doc = JsonDocument.Parse(json);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        if (string.IsNullOrWhiteSpace(content))
            return null;

        var jsonBlock = ExtractJson(content);
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        return JsonSerializer.Deserialize<AIAnalysis>(jsonBlock, options);
    }

    private static string ExtractJson(string content)
    {
        content = content.Trim();
        var match = Regex.Match(content, @"\{[\s\S]*\}");
        return match.Success ? match.Value : content;
    }
}
