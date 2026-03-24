using System.Text.Json.Serialization;

namespace FixMyBuildApi.Models;

public class AIAnalysis
{
    [JsonPropertyName("failed_stage")]
    public string FailedStage { get; set; } = string.Empty;

    [JsonPropertyName("error_summary")]
    public string ErrorSummary { get; set; } = string.Empty;

    [JsonPropertyName("root_cause")]
    public string RootCause { get; set; } = string.Empty;

    [JsonPropertyName("category")]
    public string Category { get; set; } = string.Empty;

    [JsonPropertyName("fix_suggestion")]
    public string FixSuggestion { get; set; } = string.Empty;

    [JsonPropertyName("key_error_lines")]
    public List<string> KeyErrorLines { get; set; } = new();

    [JsonPropertyName("severity")]
    public string Severity { get; set; } = "medium";

    [JsonPropertyName("confidence")]
    public int Confidence { get; set; }

    // Legacy / fallback for PR creation
    [JsonIgnore]
    public string Explanation => ErrorSummary;

    [JsonIgnore]
    public int ConfidenceScore => Confidence;
}
