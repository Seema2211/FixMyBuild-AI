using System.ComponentModel.DataAnnotations;

namespace FixMyBuildApi.Models;

public class PipelineSource
{
    [Key]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Provider { get; set; } = "github";
    public string? BaseUrl { get; set; }
    public string AccessToken { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public Guid? OrganizationId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Organization? Organization { get; set; }
    public ICollection<ConnectedRepository> Repositories { get; set; } = new List<ConnectedRepository>();
}
