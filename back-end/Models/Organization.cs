namespace FixMyBuildApi.Models;

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<OrganizationMember> Members { get; set; } = new List<OrganizationMember>();
    public ICollection<PipelineSource> PipelineSources { get; set; } = new List<PipelineSource>();
    public ICollection<NotificationSetting> NotificationSettings { get; set; } = new List<NotificationSetting>();
    public ICollection<ApiKey> ApiKeys { get; set; } = new List<ApiKey>();
}
