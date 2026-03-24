using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public interface IGitHubService
{
    Task<IReadOnlyList<PipelineRun>> GetFailedRunsAsync(string owner, string repo, CancellationToken cancellationToken = default);
    Task<string> GetRunLogsAsync(string owner, string repo, long runId, CancellationToken cancellationToken = default);
    Task<CreatedPullRequest?> CreatePullRequestAsync(string owner, string repo, string branchName, string fixContent, string commitMessage, string prTitle, string prBody, CancellationToken cancellationToken = default);
    Task<List<(int Number, string HtmlUrl)>> GetOpenPrsForBranchAsync(string owner, string repo, string branch, CancellationToken cancellationToken = default);
    Task PostPrCommentAsync(string owner, string repo, int prNumber, string body, CancellationToken cancellationToken = default);

    // Token-overridden methods for multi-source support
    Task<IReadOnlyList<PipelineRun>> GetFailedRunsAsync(string owner, string repo, string token, CancellationToken cancellationToken = default);
    Task<string> GetRunLogsAsync(string owner, string repo, long runId, string token, CancellationToken cancellationToken = default);
    Task<CreatedPullRequest?> CreatePullRequestAsync(string owner, string repo, string branchName, string fixContent, string commitMessage, string prTitle, string prBody, string token, CancellationToken cancellationToken = default);
    Task<List<(int Number, string HtmlUrl)>> GetOpenPrsForBranchAsync(string owner, string repo, string branch, string token, CancellationToken cancellationToken = default);
    Task PostPrCommentAsync(string owner, string repo, int prNumber, string body, string token, CancellationToken cancellationToken = default);
}
