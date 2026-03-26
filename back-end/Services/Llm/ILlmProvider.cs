namespace FixMyBuildApi.Services.Llm;

/// <summary>
/// Central abstraction over any LLM provider (OpenAI, Groq, Azure OpenAI, etc.).
/// AIAnalyzerService depends on this — never on a concrete provider SDK.
/// Register the correct implementation in Program.cs based on LLM:Provider config.
/// </summary>
public interface ILlmProvider
{
    /// <summary>
    /// Sends a system + user message pair and returns the raw text response.
    /// Returns null if the API key is not configured or the call fails gracefully.
    /// </summary>
    Task<string?> CompleteAsync(string systemPrompt, string userMessage, CancellationToken ct = default);
}
