using System.ComponentModel.DataAnnotations;

namespace FixMyBuildApi.Models;

public class PipelineFailure
{
    [Key]
    public string Id { get; set; } = string.Empty;
    public Guid? OrganizationId { get; set; }
    public string PipelineName { get; set; } = string.Empty;
    public string Status { get; set; } = "failure";
    public string ErrorLog { get; set; } = string.Empty;
    public string? FailedStage { get; set; }
    public string? ErrorSummary { get; set; }
    public string RootCause { get; set; } = string.Empty;
    public string? Category { get; set; }
    public string FixSuggestion { get; set; } = string.Empty;
    public List<string> KeyErrorLines { get; set; } = new();
    public string? Severity { get; set; }
    public int Confidence { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public string Command { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string? RepoOwner { get; set; }
    public string? RepoName { get; set; }
    public long? RunId { get; set; }
    public string? HeadBranch { get; set; }
    public CreatedPullRequest? CreatedPullRequest { get; set; }
    public bool PrCommentPosted { get; set; }
    public int? SourcePrNumber { get; set; }
    public string? SourcePrUrl { get; set; }
    public string? ActorLogin { get; set; }
    public string? ActorAvatarUrl { get; set; }
    public string? CommitAuthorEmail { get; set; }
    public string? CommitAuthorName { get; set; }
    public bool NotificationSent { get; set; }
}
