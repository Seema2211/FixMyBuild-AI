using FixMyBuildApi.Constants;
using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services.Providers;

public class GitHubVcsProvider : IVcsProvider
{
    private readonly IGitHubService _github;

    public GitHubVcsProvider(IGitHubService github) => _github = github;

    public string ProviderKey => VcsProvider.GitHub;

    public Task<CreatedPullRequest?> CreateFixPrAsync(
        string owner, string repo, string token,
        string branchName, string fixContent,
        string commitMessage, string prTitle, string prBody,
        CancellationToken ct = default)
        => _github.CreatePullRequestAsync(owner, repo, branchName, fixContent, commitMessage, prTitle, prBody, token, ct);

    public Task PostCommentAsync(
        string owner, string repo, string token,
        int prNumber, string commentBody,
        CancellationToken ct = default)
        => _github.PostPrCommentAsync(owner, repo, prNumber, commentBody, token, ct);

    public Task<List<(int Number, string HtmlUrl)>> GetOpenPrsForBranchAsync(
        string owner, string repo, string token,
        string branch, CancellationToken ct = default)
        => _github.GetOpenPrsForBranchAsync(owner, repo, branch, token, ct);
}
