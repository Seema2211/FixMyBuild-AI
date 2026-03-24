using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public enum LimitType { Repos, FailuresPerMonth, Members, AutoPr, AiAnalysis, Analytics, AuditLog, Notifications }

public record PlanLimits(
    int MaxRepos,
    int MaxFailuresPerMonth,
    int MaxMembers,
    int MaxAiAnalysesPerMonth,   // -1 = unlimited
    bool AutoPrEnabled,
    bool AnalyticsEnabled,
    bool AuditLogEnabled,
    bool NotificationsEnabled,
    int FailureHistoryDays        // -1 = unlimited
);

public record UsageSummary(
    int FailuresUsed, int FailuresLimit,
    int ReposUsed, int ReposLimit,
    int MembersUsed, int MembersLimit,
    int AiAnalysesUsed, int AiAnalysesLimit,
    bool AutoPrEnabled,
    bool AnalyticsEnabled,
    bool AuditLogEnabled,
    bool NotificationsEnabled,
    int FailureHistoryDays
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
    int MaxAiAnalysesPerMonth,
    bool AutoPrEnabled,
    bool AnalyticsEnabled,
    bool AuditLogEnabled,
    bool NotificationsEnabled,
    int FailureHistoryDays,
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
    Task IncrementAiAnalysisUsageAsync(Guid orgId);
    Task<int> GetFailureHistoryDaysAsync(Guid orgId);
    List<PublicPlan> GetPublicPlans();
}
