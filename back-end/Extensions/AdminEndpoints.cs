using FixMyBuildApi.Constants;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Extensions;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var admin = app.MapGroup("/api/admin").RequireAuthorization("SuperAdmin");

        // ── Platform Stats ───────────────────────────────────────
        admin.MapGet("/stats", async (AppDbContext db) =>
        {
            var month = DateTime.UtcNow.ToString(DateFormats.Month);

            var totalOrgs = await db.Organizations.CountAsync();
            var planBreakdown = await db.Subscriptions
                .GroupBy(s => s.Plan)
                .Select(g => new { Plan = g.Key.ToString(), Count = g.Count() })
                .ToListAsync();

            var totalFailuresThisMonth = await db.SubscriptionUsages
                .Where(u => u.Month == month)
                .SumAsync(u => (int?)u.FailuresIngested) ?? 0;

            var totalAiAnalysesThisMonth = await db.SubscriptionUsages
                .Where(u => u.Month == month)
                .SumAsync(u => (int?)u.AiAnalysesUsed) ?? 0;

            var recentOrgs = await db.Organizations
                .OrderByDescending(o => o.CreatedAt)
                .Take(5)
                .Select(o => new { o.Id, o.Name, o.Slug, o.CreatedAt })
                .ToListAsync();

            return Results.Ok(new
            {
                totalOrgs,
                planBreakdown,
                totalFailuresThisMonth,
                totalAiAnalysesThisMonth,
                recentOrgs
            });
        });

        // ── All Organizations ────────────────────────────────────
        admin.MapGet("/organizations", async (AppDbContext db,
            int page = 1, int pageSize = 20, string? search = null) =>
        {
            var month = DateTime.UtcNow.ToString(DateFormats.Month);

            var query = db.Organizations
                .Include(o => o.Subscription)
                .Include(o => o.Members)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
                query = query.Where(o => o.Name.ToLower().Contains(search.ToLower())
                                      || o.Slug.ToLower().Contains(search.ToLower()));

            var total = await query.CountAsync();

            var orgs = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(o => new
                {
                    o.Id,
                    o.Name,
                    o.Slug,
                    o.CreatedAt,
                    MemberCount = o.Members.Count,
                    Plan = o.Subscription != null ? o.Subscription.Plan.ToString() : "Free",
                    SubscriptionStatus = o.Subscription != null ? o.Subscription.Status.ToString() : "Active",
                    CurrentPeriodEnd = o.Subscription != null ? o.Subscription.CurrentPeriodEnd : null,
                    StripeCustomerId = o.Subscription != null ? o.Subscription.StripeCustomerId : null,
                    CancelAtPeriodEnd = o.Subscription != null && o.Subscription.CancelAtPeriodEnd,
                })
                .ToListAsync();

            return Results.Ok(new { total, page, pageSize, items = orgs });
        });

        // ── Single Organization Detail ────────────────────────────
        admin.MapGet("/organizations/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var org = await db.Organizations
                .Include(o => o.Subscription)
                .Include(o => o.Members).ThenInclude(m => m.User)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (org is null) return Results.NotFound();

            var usageHistory = await db.SubscriptionUsages
                .Where(u => u.OrganizationId == id)
                .OrderByDescending(u => u.Month)
                .Take(12)
                .Select(u => new
                {
                    u.Month,
                    u.FailuresIngested,
                    u.AiAnalysesUsed,
                    u.ReposConnected,
                    u.MembersCount,
                    u.UpdatedAt
                })
                .ToListAsync();

            var recentFailures = await db.PipelineFailures
                .Where(f => f.OrganizationId == id)
                .OrderByDescending(f => f.CreatedAt)
                .Take(10)
                .Select(f => new
                {
                    f.Id,
                    RepoFullName = (f.RepoOwner != null && f.RepoName != null)
                        ? $"{f.RepoOwner}/{f.RepoName}" : f.PipelineName,
                    BranchName = f.HeadBranch,
                    f.Status,
                    f.CreatedAt,
                    HasAiAnalysis = f.RootCause != null && f.RootCause != string.Empty
                })
                .ToListAsync();

            var repoCount = await db.ConnectedRepositories
                .Where(r => r.PipelineSource != null && r.PipelineSource.OrganizationId == id)
                .CountAsync();

            return Results.Ok(new
            {
                org.Id,
                org.Name,
                org.Slug,
                org.CreatedAt,
                Subscription = org.Subscription is null ? null : new
                {
                    org.Subscription.Plan,
                    org.Subscription.Status,
                    org.Subscription.StripeCustomerId,
                    org.Subscription.StripeSubscriptionId,
                    org.Subscription.StripePriceId,
                    org.Subscription.CurrentPeriodStart,
                    org.Subscription.CurrentPeriodEnd,
                    org.Subscription.CancelAtPeriodEnd,
                    org.Subscription.CreatedAt,
                    org.Subscription.UpdatedAt,
                },
                Members = org.Members.Select(m => new
                {
                    m.Id,
                    m.UserId,
                    m.Role,
                    m.JoinedAt,
                    Email = m.User.Email,
                    Name = $"{m.User.FirstName} {m.User.LastName}".Trim(),
                    m.User.EmailVerified
                }),
                repoCount,
                usageHistory,
                recentFailures
            });
        });

        // ── All Subscriptions ────────────────────────────────────
        admin.MapGet("/subscriptions", async (AppDbContext db,
            string? plan = null, string? status = null,
            int page = 1, int pageSize = 20) =>
        {
            var query = db.Subscriptions
                .Include(s => s.Organization)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(plan) && Enum.TryParse<PlanType>(plan, true, out var planEnum))
                query = query.Where(s => s.Plan == planEnum);

            if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<SubscriptionStatus>(status, true, out var statusEnum))
                query = query.Where(s => s.Status == statusEnum);

            var total = await query.CountAsync();

            var subs = await query
                .OrderByDescending(s => s.UpdatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new
                {
                    s.Id,
                    s.OrganizationId,
                    OrgName = s.Organization.Name,
                    OrgSlug = s.Organization.Slug,
                    Plan = s.Plan.ToString(),
                    Status = s.Status.ToString(),
                    s.StripeCustomerId,
                    s.StripeSubscriptionId,
                    s.CurrentPeriodStart,
                    s.CurrentPeriodEnd,
                    s.CancelAtPeriodEnd,
                    s.CreatedAt,
                    s.UpdatedAt,
                })
                .ToListAsync();

            return Results.Ok(new { total, page, pageSize, items = subs });
        });

        // ── Cross-org Failures ────────────────────────────────────
        admin.MapGet("/failures", async (AppDbContext db,
            Guid? orgId = null, string? status = null,
            int page = 1, int pageSize = 20) =>
        {
            var orgNames = await db.Organizations
                .ToDictionaryAsync(o => o.Id, o => o.Name);

            var query = db.PipelineFailures.AsQueryable();

            if (orgId.HasValue)
                query = query.Where(f => f.OrganizationId == orgId.Value);

            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(f => f.Status == status);

            var total = await query.CountAsync();

            var failures = await query
                .OrderByDescending(f => f.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(f => new
                {
                    f.Id,
                    f.OrganizationId,
                    RepoFullName = (f.RepoOwner != null && f.RepoName != null)
                        ? $"{f.RepoOwner}/{f.RepoName}" : f.PipelineName,
                    BranchName = f.HeadBranch,
                    f.ActorLogin,
                    f.Status,
                    f.CreatedAt,
                    HasAiAnalysis = f.RootCause != null && f.RootCause != string.Empty
                })
                .ToListAsync();

            var items = failures.Select(f => new
            {
                f.Id,
                f.OrganizationId,
                OrgName = f.OrganizationId.HasValue && orgNames.TryGetValue(f.OrganizationId.Value, out var n) ? n : null,
                f.RepoFullName,
                f.BranchName,
                f.ActorLogin,
                f.Status,
                f.CreatedAt,
                f.HasAiAnalysis
            });

            return Results.Ok(new { total, page, pageSize, items });
        });

        // ── Usage Report (cross-org monthly) ─────────────────────
        admin.MapGet("/usage", async (AppDbContext db, string? month = null) =>
        {
            var targetMonth = month ?? DateTime.UtcNow.ToString(DateFormats.Month);

            var usage = await db.SubscriptionUsages
                .Include(u => u.Organization)
                .Where(u => u.Month == targetMonth)
                .OrderByDescending(u => u.FailuresIngested)
                .Select(u => new
                {
                    u.OrganizationId,
                    OrgName = u.Organization.Name,
                    u.Month,
                    u.FailuresIngested,
                    u.AiAnalysesUsed,
                    u.ReposConnected,
                    u.MembersCount,
                    u.UpdatedAt
                })
                .ToListAsync();

            var totals = new
            {
                TotalFailures = usage.Sum(u => u.FailuresIngested),
                TotalAiAnalyses = usage.Sum(u => u.AiAnalysesUsed),
                OrgsWithData = usage.Count
            };

            return Results.Ok(new { month = targetMonth, totals, items = usage });
        });
    }
}
