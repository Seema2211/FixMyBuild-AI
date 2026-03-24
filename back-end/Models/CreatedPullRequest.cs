namespace FixMyBuildApi.Models;

public class CreatedPullRequest
{
    public int PrNumber { get; set; }
    public string HtmlUrl { get; set; } = string.Empty;
    public string BranchName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    /// <summary>Files changed or diff summary for UI display.</summary>
    public string ChangesSummary { get; set; } = string.Empty;
}
