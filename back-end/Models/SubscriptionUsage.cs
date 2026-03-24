namespace FixMyBuildApi.Models;

public class SubscriptionUsage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    // Format: "2026-03" (year-month)
    public string Month { get; set; } = string.Empty;

    public int FailuresIngested { get; set; } = 0;
    public int ReposConnected { get; set; } = 0;
    public int MembersCount { get; set; } = 0;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
