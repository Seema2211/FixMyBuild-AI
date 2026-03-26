using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public interface IAIAnalyzerService
{
    /// <summary>
    /// Analyzes a CI/CD error log and returns structured AI analysis.
    /// When orgId is provided and the org is on a Pro+ plan, historical pattern context
    /// is injected into the prompt to improve accuracy (self-learning augmentation).
    /// </summary>
    Task<AIAnalysis?> AnalyzeLogsAsync(
        string log,
        Guid? orgId = null,
        CancellationToken cancellationToken = default);
}
