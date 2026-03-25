using FixMyBuildApi.Constants;
using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services.Providers;

/// <summary>
/// GitLab VCS provider.
/// Uses the GitLab REST API (merge requests, notes).
/// TODO: implement when GitLab integration is added.
/// </summary>
public class GitLabVcsProvider : IVcsProvider
{
    public string ProviderKey => VcsProvider.GitLab;

    public Task<CreatedPullRequest?> CreateFixPrAsync(
        string owner, string repo, string token,
        string branchName, string fixContent,
        string commitMessage, string prTitle, string prBody,
        CancellationToken ct = default)
        => Task.FromResult<CreatedPullRequest?>(null); // TODO: POST /projects/:id/merge_requests

    public Task PostCommentAsync(
        string owner, string repo, string token,
        int prNumber, string commentBody,
        CancellationToken ct = default)
        => Task.CompletedTask; // TODO: POST /projects/:id/merge_requests/:iid/notes

    public Task<List<(int Number, string HtmlUrl)>> GetOpenPrsForBranchAsync(
        string owner, string repo, string token,
        string branch, CancellationToken ct = default)
        => Task.FromResult(new List<(int, string)>()); // TODO: GET /projects/:id/merge_requests?source_branch=...
}
