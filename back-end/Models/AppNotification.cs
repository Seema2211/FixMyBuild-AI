namespace FixMyBuildApi.Models;

public class AppNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid? UserId { get; set; }           // null = org-wide
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info";  // info | success | warning | error
    public string? Link { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization Organization { get; set; } = null!;
}

public static class NotificationType
{
    public const string Info = "info";
    public const string Success = "success";
    public const string Warning = "warning";
    public const string Error = "error";
}
