namespace FixMyBuildApi.Models;

public class PipelineRun
{
    public long RunId { get; set; }
    public string Repository { get; set; } = string.Empty;
    public string WorkflowName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Conclusion { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? HeadBranch { get; set; }

    // Actor info (who triggered the run / PR author)
    public string? ActorLogin { get; set; }
    public string? ActorAvatarUrl { get; set; }
    public string? CommitAuthorEmail { get; set; }
    public string? CommitAuthorName { get; set; }
}
