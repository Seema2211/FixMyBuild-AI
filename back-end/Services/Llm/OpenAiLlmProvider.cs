using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace FixMyBuildApi.Services.Llm;

/// <summary>
/// ILlmProvider implementation for OpenAI (api.openai.com).
/// Uses GPT-4o-mini by default with native JSON mode for reliable structured output.
/// Configure via appsettings: LLM:Provider=openai, LLM:Model, LLM:ApiKey
/// or environment variables: LLM__Provider, LLM__Model, LLM__ApiKey
/// </summary>
public sealed class OpenAiLlmProvider : ILlmProvider
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _model;

    public OpenAiLlmProvider(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["LLM:ApiKey"] ?? "";
        _model  = config["LLM:Model"]  ?? "gpt-4o-mini";
    }

    public async Task<string?> CompleteAsync(string systemPrompt, string userMessage, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return null;

        var body = new
        {
            model    = _model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user",   content = userMessage  },
            },
            temperature     = 0,      // deterministic — we want consistent JSON
            max_tokens      = 1024,
            response_format = new { type = "json_object" }, // native JSON mode — no markdown leakage
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");

        var response = await _http.SendAsync(request, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();
    }
}
