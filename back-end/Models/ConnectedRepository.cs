using System.ComponentModel.DataAnnotations;

namespace FixMyBuildApi.Models;

public class ConnectedRepository
{
    [Key]
    public int Id { get; set; }

    public int PipelineSourceId { get; set; }

    /// <summary>Full repository name, e.g. "owner/repo"</summary>
    public string FullName { get; set; } = string.Empty;

    public bool IsActive { get; set; } = true;

    /// <summary>Whether the background worker should auto-analyze failures</summary>
    public bool AutoAnalyze { get; set; } = true;

    /// <summary>Whether to auto-create fix PRs when confidence is high</summary>
    public bool AutoCreatePr { get; set; } = true;

    public DateTime? LastSyncedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public PipelineSource PipelineSource { get; set; } = null!;
}
