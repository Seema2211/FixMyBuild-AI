using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services.Providers;

/// <summary>
/// Provider-agnostic interface for interacting with a VCS hosting platform.
/// Implementations: GitHub, GitLab, AzureDevOps, Bitbucket, etc.
/// </summary>
public interface IVcsProvider
{
    /// <summary>Key matching <see cref="PipelineSource.Provider"/> (e.g. "github", "gitlab", "azure_devops").</summary>
    string ProviderKey { get; }

    /// <summary>Create a fix branch + commit + pull/merge request.</summary>
    Task<CreatedPullRequest?> CreateFixPrAsync(
        string owner, string repo, string token,
        string branchName, string fixContent,
        string commitMessage, string prTitle, string prBody,
        CancellationToken ct = default);

    /// <summary>Post an AI analysis comment on an existing PR/MR.</summary>
    Task PostCommentAsync(
        string owner, string repo, string token,
        int prNumber, string commentBody,
        CancellationToken ct = default);

    /// <summary>Return open PRs/MRs whose source branch matches <paramref name="branch"/>.</summary>
    Task<List<(int Number, string HtmlUrl)>> GetOpenPrsForBranchAsync(
        string owner, string repo, string token,
        string branch, CancellationToken ct = default);
}
