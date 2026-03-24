using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public interface IAIAnalyzerService
{
    Task<AIAnalysis?> AnalyzeLogsAsync(string log, CancellationToken cancellationToken = default);
}
