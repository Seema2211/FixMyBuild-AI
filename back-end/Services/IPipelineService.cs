using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public interface IPipelineService
{
    Task ProcessFailuresAsync(string owner, string repo, CancellationToken cancellationToken = default);
    Task ProcessFailuresWithTokenAsync(string owner, string repo, string token, Guid? orgId = null, CancellationToken cancellationToken = default);
    Task<PipelineFailure?> AnalyzeSingleRunAsync(string owner, string repo, long runId, Guid? orgId = null, CancellationToken cancellationToken = default);
    Task<PipelinePage> GetAllFailuresAsync(string? search = null, string? severity = null, int page = 1, int pageSize = 20, Guid? orgId = null, CancellationToken cancellationToken = default, int historyDays = -1);
    Task<PipelineFailure?> GetFailureByIdAsync(string id, Guid? orgId = null, CancellationToken cancellationToken = default);
    Task<PipelineFailure?> UpdatePullRequestAsync(string failureId, CreatedPullRequest pr, CancellationToken cancellationToken = default);
    Task<PipelineStats> GetStatsAsync(Guid? orgId = null, CancellationToken cancellationToken = default);
    Task SeedDemoDataAsync(Guid? orgId = null, CancellationToken cancellationToken = default);
    Task<PipelineAnalytics> GetAnalyticsAsync(Guid? orgId = null, CancellationToken cancellationToken = default);
}

public class PipelinePage
{
    public List<PipelineFailure> Items { get; set; } = new();
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
