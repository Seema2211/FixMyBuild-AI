using FixMyBuildApi.Constants;
using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services.Providers;

/// <summary>
/// Azure DevOps VCS provider.
/// Uses the Azure DevOps REST API (pull requests, threads/comments).
/// TODO: implement when Azure DevOps integration is added.
/// </summary>
public class AzureDevOpsVcsProvider : IVcsProvider
{
    public string ProviderKey => VcsProvider.AzureDevOps;

    public Task<CreatedPullRequest?> CreateFixPrAsync(
        string owner, string repo, string token,
        string branchName, string fixContent,
        string commitMessage, string prTitle, string prBody,
        CancellationToken ct = default)
        => Task.FromResult<CreatedPullRequest?>(null); // TODO: POST /{org}/{project}/_apis/git/repositories/{repo}/pullrequests

    public Task PostCommentAsync(
        string owner, string repo, string token,
        int prNumber, string commentBody,
        CancellationToken ct = default)
        => Task.CompletedTask; // TODO: POST /_apis/git/repositories/{repo}/pullrequests/{id}/threads

    public Task<List<(int Number, string HtmlUrl)>> GetOpenPrsForBranchAsync(
        string owner, string repo, string token,
        string branch, CancellationToken ct = default)
        => Task.FromResult(new List<(int, string)>()); // TODO: GET /_apis/git/repositories/{repo}/pullrequests?searchCriteria.sourceRefName=...
}
