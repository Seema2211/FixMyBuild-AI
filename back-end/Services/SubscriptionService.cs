using FixMyBuildApi.Constants;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;
using SubscriptionService2 = Stripe.SubscriptionService;

namespace FixMyBuildApi.Services;

public class SubscriptionService : ISubscriptionService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    private static readonly Dictionary<PlanType, PlanLimits> Limits = new()
    {
        [PlanType.Free] = new PlanLimits(
            MaxRepos: 3,
            MaxFailuresPerMonth: 100,
            MaxMembers: 1,
            MaxAiAnalysesPerMonth: 25,
            AutoPrEnabled: false,
            AnalyticsEnabled: false,
            AuditLogEnabled: false,
            NotificationsEnabled: false,
            FailureHistoryDays: 7
        ),
        [PlanType.Pro] = new PlanLimits(
            MaxRepos: 20,
            MaxFailuresPerMonth: 5000,
            MaxMembers: 10,
            MaxAiAnalysesPerMonth: -1,
            AutoPrEnabled: true,
            AnalyticsEnabled: true,
            AuditLogEnabled: true,
            NotificationsEnabled: true,
            FailureHistoryDays: 90
        ),
        [PlanType.Business] = new PlanLimits(
            MaxRepos: int.MaxValue,
            MaxFailuresPerMonth: int.MaxValue,
            MaxMembers: int.MaxValue,
            MaxAiAnalysesPerMonth: -1,
            AutoPrEnabled: true,
            AnalyticsEnabled: true,
            AuditLogEnabled: true,
            NotificationsEnabled: true,
            FailureHistoryDays: -1
        ),
    };

    public SubscriptionService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
        StripeConfiguration.ApiKey = config["Stripe:SecretKey"];
    }

    // ── Get current plan + usage ─────────────────────────────────────────────

    public async Task<BillingPlan> GetCurrentPlanAsync(Guid orgId)
    {
        var sub = await GetOrCreateFreeSubscriptionAsync(orgId);
        var limits = Limits[sub.Plan];
        var usage = await GetUsageAsync(orgId, limits);

        return new BillingPlan(
            Plan: sub.Plan,
            Status: sub.Status,
            CurrentPeriodEnd: sub.CurrentPeriodEnd,
            CancelAtPeriodEnd: sub.CancelAtPeriodEnd,
            StripeCustomerId: sub.StripeCustomerId,
            Usage: usage
        );
    }

    // ── Stripe Checkout ──────────────────────────────────────────────────────

    public async Task<string> CreateCheckoutSessionAsync(Guid orgId, string priceId, string successUrl, string cancelUrl)
    {
        var sub = await GetOrCreateFreeSubscriptionAsync(orgId);
        var org = await _db.Organizations.FindAsync(orgId)
            ?? throw new InvalidOperationException("Organization not found");

        var options = new SessionCreateOptions
        {
            Mode = "subscription",
            LineItems = new List<SessionLineItemOptions>
            {
                new() { Price = priceId, Quantity = 1 }
            },
            SuccessUrl = successUrl,
            CancelUrl = cancelUrl,
            ClientReferenceId = orgId.ToString(),
            Metadata = new Dictionary<string, string> { ["orgId"] = orgId.ToString() }
        };

        if (!string.IsNullOrEmpty(sub.StripeCustomerId))
            options.Customer = sub.StripeCustomerId;

        var service = new SessionService();
        var session = await service.CreateAsync(options);
        return session.Url;
    }

    // ── Stripe Billing Portal ────────────────────────────────────────────────

    public async Task<string> CreateBillingPortalSessionAsync(Guid orgId, string returnUrl)
    {
        var sub = await GetOrCreateFreeSubscriptionAsync(orgId);

        if (string.IsNullOrEmpty(sub.StripeCustomerId))
            throw new InvalidOperationException("No Stripe customer found. Please upgrade first.");

        var options = new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = sub.StripeCustomerId,
            ReturnUrl = returnUrl
        };

        var service = new Stripe.BillingPortal.SessionService();
        var session = await service.CreateAsync(options);
        return session.Url;
    }

    // ── Webhook Handler ──────────────────────────────────────────────────────

    public async Task HandleWebhookAsync(string payload, string stripeSignature)
    {
        var webhookSecret = _config["Stripe:WebhookSecret"]!;
        var stripeEvent = EventUtility.ConstructEvent(payload, stripeSignature, webhookSecret);

        switch (stripeEvent.Type)
        {
            case EventTypes.CheckoutSessionCompleted:
                await HandleCheckoutCompleted(stripeEvent);
                break;
            case EventTypes.CustomerSubscriptionUpdated:
                await HandleSubscriptionUpdated(stripeEvent);
                break;
            case EventTypes.CustomerSubscriptionDeleted:
                await HandleSubscriptionDeleted(stripeEvent);
                break;
            case EventTypes.InvoicePaymentSucceeded:
                await HandleInvoicePaymentSucceeded(stripeEvent);
                break;
            case EventTypes.InvoicePaymentFailed:
                await HandleInvoicePaymentFailed(stripeEvent);
                break;
        }
    }

    // ── Limit Enforcement ────────────────────────────────────────────────────

    public async Task EnforceLimitAsync(Guid orgId, LimitType limitType)
    {
        var sub = await GetOrCreateFreeSubscriptionAsync(orgId);
        var limits = Limits[sub.Plan];
        var currentMonth = DateTime.UtcNow.ToString(DateFormats.Month);

        switch (limitType)
        {
            case LimitType.Repos:
                var repoCount = await _db.ConnectedRepositories
                    .CountAsync(r => r.PipelineSource.OrganizationId == orgId);
                if (repoCount >= limits.MaxRepos)
                    throw new PlanLimitException("repos", limits.MaxRepos, sub.Plan);
                break;

            case LimitType.FailuresPerMonth:
                var usage = await _db.SubscriptionUsages
                    .FirstOrDefaultAsync(u => u.OrganizationId == orgId && u.Month == currentMonth);
                if ((usage?.FailuresIngested ?? 0) >= limits.MaxFailuresPerMonth)
                    throw new PlanLimitException("failures_per_month", limits.MaxFailuresPerMonth, sub.Plan);
                break;

            case LimitType.Members:
                var memberCount = await _db.OrganizationMembers
                    .CountAsync(m => m.OrganizationId == orgId);
                if (memberCount >= limits.MaxMembers)
                    throw new PlanLimitException("members", limits.MaxMembers, sub.Plan);
                break;

            case LimitType.AutoPr:
                if (!limits.AutoPrEnabled)
                    throw new PlanLimitException("auto_pr", 0, sub.Plan);
                break;

            case LimitType.AiAnalysis:
                if (limits.MaxAiAnalysesPerMonth == -1) break; // unlimited
                var aiUsage = await _db.SubscriptionUsages
                    .FirstOrDefaultAsync(u => u.OrganizationId == orgId && u.Month == currentMonth);
                if ((aiUsage?.AiAnalysesUsed ?? 0) >= limits.MaxAiAnalysesPerMonth)
                    throw new PlanLimitException("ai_analyses", limits.MaxAiAnalysesPerMonth, sub.Plan);
                break;

            case LimitType.Analytics:
                if (!limits.AnalyticsEnabled)
                    throw new PlanLimitException("analytics", 0, sub.Plan);
                break;

            case LimitType.AuditLog:
                if (!limits.AuditLogEnabled)
                    throw new PlanLimitException("audit_log", 0, sub.Plan);
                break;

            case LimitType.Notifications:
                if (!limits.NotificationsEnabled)
                    throw new PlanLimitException("notifications", 0, sub.Plan);
                break;
        }
    }

    // ── Usage Increment ──────────────────────────────────────────────────────

    public async Task IncrementFailureUsageAsync(Guid orgId)
    {
        var usage = await GetOrCreateUsageAsync(orgId);
        usage.FailuresIngested++;
        usage.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task IncrementAiAnalysisUsageAsync(Guid orgId)
    {
        var usage = await GetOrCreateUsageAsync(orgId);
        usage.AiAnalysesUsed++;
        usage.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    public async Task<int> GetFailureHistoryDaysAsync(Guid orgId)
    {
        var sub = await GetOrCreateFreeSubscriptionAsync(orgId);
        return Limits[sub.Plan].FailureHistoryDays;
    }

    // ── Public Plans ─────────────────────────────────────────────────────────

    // Single source of truth: all numeric limits come from the Limits dictionary above.
    // Only feature descriptions (marketing copy) live here.
    public List<PublicPlan> GetPublicPlans()
    {
        var free     = Limits[PlanType.Free];
        var pro      = Limits[PlanType.Pro];
        var business = Limits[PlanType.Business];

        return new List<PublicPlan>
        {
            new PublicPlan(
                Id: "free", Name: "Free", Price: 0, PriceId: "",
                MaxRepos: free.MaxRepos,
                MaxFailuresPerMonth: free.MaxFailuresPerMonth,
                MaxMembers: free.MaxMembers,
                MaxAiAnalysesPerMonth: free.MaxAiAnalysesPerMonth,
                AutoPrEnabled: free.AutoPrEnabled,
                AnalyticsEnabled: free.AnalyticsEnabled,
                AuditLogEnabled: free.AuditLogEnabled,
                NotificationsEnabled: free.NotificationsEnabled,
                FailureHistoryDays: free.FailureHistoryDays,
                Features: new List<string>
                {
                    $"{free.MaxRepos} repositories",
                    $"{free.MaxFailuresPerMonth} pipeline failures/month",
                    $"{free.MaxAiAnalysesPerMonth} AI analyses/month",
                    $"{free.MaxMembers} team member (solo)",
                    $"{free.FailureHistoryDays}-day failure history",
                    "Push-based ingest",
                    "Community support"
                }
            ),
            new PublicPlan(
                Id: "pro", Name: "Pro", Price: 29, PriceId: _config["Stripe:Prices:Pro"]!,
                MaxRepos: pro.MaxRepos,
                MaxFailuresPerMonth: pro.MaxFailuresPerMonth,
                MaxMembers: pro.MaxMembers,
                MaxAiAnalysesPerMonth: pro.MaxAiAnalysesPerMonth,
                AutoPrEnabled: pro.AutoPrEnabled,
                AnalyticsEnabled: pro.AnalyticsEnabled,
                AuditLogEnabled: pro.AuditLogEnabled,
                NotificationsEnabled: pro.NotificationsEnabled,
                FailureHistoryDays: pro.FailureHistoryDays,
                Features: new List<string>
                {
                    $"{pro.MaxRepos} repositories",
                    $"{pro.MaxFailuresPerMonth:N0} pipeline failures/month",
                    "Unlimited AI analyses",
                    $"{pro.MaxMembers} team members",
                    "AI auto-PR creation",
                    "Trend analytics & insights",
                    "Audit log",
                    "Slack & email notifications",
                    $"{pro.FailureHistoryDays}-day failure history",
                    "Priority email support"
                }
            ),
            new PublicPlan(
                Id: "business", Name: "Business", Price: 99, PriceId: _config["Stripe:Prices:Business"]!,
                MaxRepos: business.MaxRepos,
                MaxFailuresPerMonth: business.MaxFailuresPerMonth,
                MaxMembers: business.MaxMembers,
                MaxAiAnalysesPerMonth: business.MaxAiAnalysesPerMonth,
                AutoPrEnabled: business.AutoPrEnabled,
                AnalyticsEnabled: business.AnalyticsEnabled,
                AuditLogEnabled: business.AuditLogEnabled,
                NotificationsEnabled: business.NotificationsEnabled,
                FailureHistoryDays: business.FailureHistoryDays,
                Features: new List<string>
                {
                    "Unlimited repositories",
                    "Unlimited pipeline failures",
                    "Unlimited AI analyses (priority model)",
                    "Unlimited team members",
                    "AI auto-PR creation",
                    "Trend analytics & insights",
                    "Audit log",
                    "Slack & email notifications",
                    "Unlimited failure history",
                    "Dedicated support & SLA"
                }
            ),
        };
    }

    // ── Private Helpers ──────────────────────────────────────────────────────

    private async Task<Models.Subscription> GetOrCreateFreeSubscriptionAsync(Guid orgId)
    {
        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.OrganizationId == orgId);
        if (sub != null) return sub;

        sub = new Models.Subscription { OrganizationId = orgId, Plan = PlanType.Free, Status = SubscriptionStatus.Active };
        _db.Subscriptions.Add(sub);
        await _db.SaveChangesAsync();
        return sub;
    }

    private async Task<SubscriptionUsage> GetOrCreateUsageAsync(Guid orgId)
    {
        var currentMonth = DateTime.UtcNow.ToString(DateFormats.Month);
        var usage = await _db.SubscriptionUsages
            .FirstOrDefaultAsync(u => u.OrganizationId == orgId && u.Month == currentMonth);

        if (usage == null)
        {
            usage = new SubscriptionUsage { OrganizationId = orgId, Month = currentMonth };
            _db.SubscriptionUsages.Add(usage);
        }
        return usage;
    }

    private async Task<UsageSummary> GetUsageAsync(Guid orgId, PlanLimits limits)
    {
        var currentMonth = DateTime.UtcNow.ToString(DateFormats.Month);

        var usage = await _db.SubscriptionUsages
            .FirstOrDefaultAsync(u => u.OrganizationId == orgId && u.Month == currentMonth);

        var repoCount = await _db.ConnectedRepositories
            .CountAsync(r => r.PipelineSource.OrganizationId == orgId);

        var memberCount = await _db.OrganizationMembers
            .CountAsync(m => m.OrganizationId == orgId);

        return new UsageSummary(
            FailuresUsed: usage?.FailuresIngested ?? 0,
            FailuresLimit: limits.MaxFailuresPerMonth == int.MaxValue ? -1 : limits.MaxFailuresPerMonth,
            ReposUsed: repoCount,
            ReposLimit: limits.MaxRepos == int.MaxValue ? -1 : limits.MaxRepos,
            MembersUsed: memberCount,
            MembersLimit: limits.MaxMembers == int.MaxValue ? -1 : limits.MaxMembers,
            AiAnalysesUsed: usage?.AiAnalysesUsed ?? 0,
            AiAnalysesLimit: limits.MaxAiAnalysesPerMonth,
            AutoPrEnabled: limits.AutoPrEnabled,
            AnalyticsEnabled: limits.AnalyticsEnabled,
            AuditLogEnabled: limits.AuditLogEnabled,
            NotificationsEnabled: limits.NotificationsEnabled,
            FailureHistoryDays: limits.FailureHistoryDays
        );
    }

    private async Task HandleCheckoutCompleted(Event stripeEvent)
    {
        var session = (Session)stripeEvent.Data.Object;
        if (!Guid.TryParse(session.Metadata?.GetValueOrDefault("orgId"), out var orgId)) return;

        var stripeSubId = session.SubscriptionId;
        var subService = new SubscriptionService2();
        var stripeSub = await subService.GetAsync(stripeSubId);
        var item = stripeSub.Items.Data[0];
        var plan = ResolvePlan(item.Price.Id);

        var sub = await GetOrCreateFreeSubscriptionAsync(orgId);
        sub.Plan = plan;
        sub.Status = SubscriptionStatus.Active;
        sub.StripeCustomerId = session.CustomerId;
        sub.StripeSubscriptionId = stripeSubId;
        sub.StripePriceId = item.Price.Id;
        sub.CurrentPeriodStart = item.CurrentPeriodStart;
        sub.CurrentPeriodEnd = item.CurrentPeriodEnd;
        sub.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    private async Task HandleSubscriptionUpdated(Event stripeEvent)
    {
        var stripeSub = (Stripe.Subscription)stripeEvent.Data.Object;
        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSub.Id);
        if (sub == null) return;

        var item = stripeSub.Items.Data[0];
        sub.Plan = ResolvePlan(item.Price.Id);
        sub.Status = ResolveStatus(stripeSub.Status);
        sub.StripePriceId = item.Price.Id;
        sub.CurrentPeriodStart = item.CurrentPeriodStart;
        sub.CurrentPeriodEnd = item.CurrentPeriodEnd;
        sub.CancelAtPeriodEnd = stripeSub.CancelAtPeriodEnd;
        sub.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    private async Task HandleSubscriptionDeleted(Event stripeEvent)
    {
        var stripeSub = (Stripe.Subscription)stripeEvent.Data.Object;
        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.StripeSubscriptionId == stripeSub.Id);
        if (sub == null) return;

        sub.Plan = PlanType.Free;
        sub.Status = SubscriptionStatus.Canceled;
        sub.StripeSubscriptionId = null;
        sub.StripePriceId = null;
        sub.CancelAtPeriodEnd = false;
        sub.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
    }

    private async Task HandleInvoicePaymentSucceeded(Event stripeEvent)
    {
        var invoice = (Invoice)stripeEvent.Data.Object;
        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.StripeCustomerId == invoice.CustomerId);
        if (sub == null) return;

        // Reset monthly usage counters on renewal
        var currentMonth = DateTime.UtcNow.ToString(DateFormats.Month);
        var usage = await _db.SubscriptionUsages
            .FirstOrDefaultAsync(u => u.OrganizationId == sub.OrganizationId && u.Month == currentMonth);
        if (usage != null)
        {
            usage.FailuresIngested = 0;
            usage.AiAnalysesUsed = 0;
            usage.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
    }

    private async Task HandleInvoicePaymentFailed(Event stripeEvent)
    {
        var invoice = (Invoice)stripeEvent.Data.Object;
        var sub = await _db.Subscriptions.FirstOrDefaultAsync(s => s.StripeCustomerId == invoice.CustomerId);
        if (sub == null) return;

        sub.Status = SubscriptionStatus.PastDue;
        sub.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
    }

    private PlanType ResolvePlan(string priceId)
    {
        if (priceId == _config["Stripe:Prices:Pro"]) return PlanType.Pro;
        if (priceId == _config["Stripe:Prices:Business"]) return PlanType.Business;
        return PlanType.Free;
    }

    private static SubscriptionStatus ResolveStatus(string stripeStatus) => stripeStatus switch
    {
        "active"   => SubscriptionStatus.Active,
        "trialing" => SubscriptionStatus.Trialing,
        "past_due" => SubscriptionStatus.PastDue,
        _          => SubscriptionStatus.Canceled
    };
}

public class PlanLimitException : Exception
{
    public string LimitName { get; }
    public int Limit { get; }
    public PlanType CurrentPlan { get; }

    public PlanLimitException(string limitName, int limit, PlanType currentPlan)
        : base($"Plan limit reached: {limitName}")
    {
        LimitName = limitName;
        Limit = limit;
        CurrentPlan = currentPlan;
    }
}
