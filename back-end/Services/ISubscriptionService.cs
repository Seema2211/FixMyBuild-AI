using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public enum LimitType { Repos, FailuresPerMonth, Members, AutoPr }

public record PlanLimits(int MaxRepos, int MaxFailuresPerMonth, int MaxMembers, bool AutoPrEnabled);

public record UsageSummary(
    int FailuresUsed, int FailuresLimit,
    int ReposUsed, int ReposLimit,
    int MembersUsed, int MembersLimit,
    bool AutoPrEnabled
);

public record BillingPlan(
    PlanType Plan,
    SubscriptionStatus Status,
    DateTime? CurrentPeriodEnd,
    bool CancelAtPeriodEnd,
    string? StripeCustomerId,
    UsageSummary Usage
);

public record PublicPlan(
    string Id,
    string Name,
    decimal Price,
    string PriceId,
    int MaxRepos,
    int MaxFailuresPerMonth,
    int MaxMembers,
    bool AutoPrEnabled,
    List<string> Features
);

public interface ISubscriptionService
{
    Task<BillingPlan> GetCurrentPlanAsync(Guid orgId);
    Task<string> CreateCheckoutSessionAsync(Guid orgId, string priceId, string successUrl, string cancelUrl);
    Task<string> CreateBillingPortalSessionAsync(Guid orgId, string returnUrl);
    Task HandleWebhookAsync(string payload, string stripeSignature);
    Task EnforceLimitAsync(Guid orgId, LimitType limitType);
    Task IncrementFailureUsageAsync(Guid orgId);
    List<PublicPlan> GetPublicPlans();
}
