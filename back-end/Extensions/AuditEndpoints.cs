using System.Security.Claims;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Extensions;

public static class AuditEndpoints
{
    public static void MapAuditEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/audit").RequireAuthorization();

        group.MapGet("/", async (
            ClaimsPrincipal user, AppDbContext db, ISubscriptionService subscriptionService,
            int page = 1, int pageSize = 50, string? action = null,
            CancellationToken ct = default) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            if (!user.IsSuperAdmin())
            {
                try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.AuditLog); }
                catch (PlanLimitException ex)
                {
                    return ApiErrors.PlanLimit(ex);
                }
            }

            pageSize = Math.Clamp(pageSize, 1, 100);
            page = Math.Max(1, page);

            var isAdmin = user.GetRole() == OrgRole.Admin;
            var currentUserId = user.GetUserId();

            var query = db.AuditLogs
                .Where(a => a.OrganizationId == orgId.Value);

            // Non-admins see only their own events
            if (!isAdmin && currentUserId.HasValue)
                query = query.Where(a => a.UserId == currentUserId.Value);

            if (!string.IsNullOrWhiteSpace(action))
                query = query.Where(a => a.Action == action);

            var total = await query.CountAsync(ct);

            var items = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(a => new
                {
                    a.Id,
                    a.Action,
                    a.ActorEmail,
                    a.TargetEmail,
                    a.Details,
                    a.CreatedAt,
                })
                .ToListAsync(ct);

            return Results.Ok(new { total, page, pageSize, items });
        });
    }
}
