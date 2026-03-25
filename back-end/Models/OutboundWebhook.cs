namespace FixMyBuildApi.Models;

public class OutboundWebhook
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string? Secret { get; set; }         // HMAC-SHA256 signing secret
    public List<string> Events { get; set; } = new(); // failure.created | failure.analyzed | failure.resolved
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Organization Organization { get; set; } = null!;
    public ICollection<WebhookDelivery> Deliveries { get; set; } = new List<WebhookDelivery>();
}

public class WebhookDelivery
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WebhookId { get; set; }
    public string Event { get; set; } = string.Empty;
    public string Payload { get; set; } = string.Empty;
    public int? StatusCode { get; set; }
    public string? ResponseBody { get; set; }
    public int AttemptCount { get; set; } = 1;
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public OutboundWebhook Webhook { get; set; } = null!;
}
