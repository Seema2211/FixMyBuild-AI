namespace FixMyBuildApi.Models;

public class PullRequestRequest
{
    public string PipelineFailureId { get; set; } = string.Empty;
    public string? BranchName { get; set; }
    public string RepoOwner { get; set; } = string.Empty;
    public string RepoName { get; set; } = string.Empty;
}
