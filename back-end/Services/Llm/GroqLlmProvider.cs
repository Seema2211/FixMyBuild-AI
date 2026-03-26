using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace FixMyBuildApi.Services.Llm;

/// <summary>
/// ILlmProvider implementation for Groq (api.groq.com).
/// Uses Llama-3.3-70b by default — free tier, fast, suitable for development.
/// Configure via appsettings: LLM:Provider=groq, LLM:Model, LLM:ApiKey
/// Switch to OpenAiLlmProvider in production via LLM:Provider=openai.
/// </summary>
public sealed class GroqLlmProvider : ILlmProvider
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _model;

    public GroqLlmProvider(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["LLM:ApiKey"] ?? config["OPENAI_API_KEY"] ?? ""; // backward-compat fallback
        _model  = config["LLM:Model"]  ?? "llama-3.3-70b-versatile";
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
            temperature = 0.2,
            max_tokens  = 1024,
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.groq.com/openai/v1/chat/completions");
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
