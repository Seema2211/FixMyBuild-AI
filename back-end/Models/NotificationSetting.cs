using System.ComponentModel.DataAnnotations;

namespace FixMyBuildApi.Models;

public class NotificationSetting
{
    [Key]
    public int Id { get; set; }
    public Guid? OrganizationId { get; set; }

    // Slack
    public string? SlackWebhookUrl { get; set; }
    public bool SlackEnabled { get; set; }

    // Email (SMTP)
    public string? SmtpHost { get; set; }
    public int SmtpPort { get; set; } = 587;
    public string? SmtpUsername { get; set; }
    public string? SmtpPassword { get; set; }
    public string? SmtpFromEmail { get; set; }
    public bool SmtpUseSsl { get; set; } = true;
    public bool EmailEnabled { get; set; }

    public bool NotifyPrAuthor { get; set; } = true;
    public string? AdditionalRecipients { get; set; }
    public bool NotifyOnHigh { get; set; } = true;
    public bool NotifyOnMedium { get; set; } = true;
    public bool NotifyOnLow { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Organization? Organization { get; set; }
}
