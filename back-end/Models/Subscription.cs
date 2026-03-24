namespace FixMyBuildApi.Models;

public enum PlanType { Free, Pro, Business }
public enum SubscriptionStatus { Active, Trialing, PastDue, Canceled }

public class Subscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Organization Organization { get; set; } = null!;

    public PlanType Plan { get; set; } = PlanType.Free;
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

    // Stripe identifiers (null for Free plan)
    public string? StripeCustomerId { get; set; }
    public string? StripeSubscriptionId { get; set; }
    public string? StripePriceId { get; set; }

    public DateTime? CurrentPeriodStart { get; set; }
    public DateTime? CurrentPeriodEnd { get; set; }
    public bool CancelAtPeriodEnd { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
