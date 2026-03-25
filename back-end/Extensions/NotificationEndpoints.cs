using System.Security.Claims;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Extensions;

public static class NotificationEndpoints
{
    public static void MapNotificationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/notifications").RequireAuthorization();

        // GET /api/notifications — paginated + unread count
        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db,
            int page = 1, int pageSize = 20, CancellationToken ct = default) =>
        {
            var orgId = principal.GetOrgId();
            var userId = principal.GetUserId();
            if (orgId is null || userId is null) return Results.Unauthorized();

            pageSize = Math.Clamp(pageSize, 1, 50);
            page = Math.Max(1, page);

            // User sees org-wide + their own personal notifications
            var query = db.AppNotifications
                .Where(n => n.OrganizationId == orgId.Value && (n.UserId == null || n.UserId == userId.Value))
                .OrderByDescending(n => n.CreatedAt);

            var total = await query.CountAsync(ct);
            var unread = await query.CountAsync(n => !n.IsRead, ct);

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(n => new
                {
                    n.Id, n.Title, n.Message, n.Type, n.Link, n.IsRead, n.CreatedAt
                })
                .ToListAsync(ct);

            return Results.Ok(new { total, unread, page, pageSize, items });
        });

        // GET /api/notifications/unread-count
        group.MapGet("/unread-count", async (ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            var userId = principal.GetUserId();
            if (orgId is null || userId is null) return Results.Unauthorized();

            var count = await db.AppNotifications
                .CountAsync(n => n.OrganizationId == orgId.Value
                    && (n.UserId == null || n.UserId == userId.Value)
                    && !n.IsRead, ct);

            return Results.Ok(new { count });
        });

        // PATCH /api/notifications/{id}/read
        group.MapPatch("/{id:guid}/read", async (Guid id, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var notification = await db.AppNotifications
                .FirstOrDefaultAsync(n => n.Id == id && n.OrganizationId == orgId.Value, ct);
            if (notification is null) return Results.NotFound();

            notification.IsRead = true;
            await db.SaveChangesAsync(ct);
            return Results.Ok();
        });

        // PATCH /api/notifications/read-all
        group.MapPatch("/read-all", async (ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            var userId = principal.GetUserId();
            if (orgId is null || userId is null) return Results.Unauthorized();

            await db.AppNotifications
                .Where(n => n.OrganizationId == orgId.Value
                    && (n.UserId == null || n.UserId == userId.Value)
                    && !n.IsRead)
                .ExecuteUpdateAsync(s => s.SetProperty(n => n.IsRead, true), ct);

            return Results.Ok();
        });
    }

    // ── Helper: create a notification and broadcast via SSE ───────
    public static async Task CreateAndPublishAsync(
        AppDbContext db, ISseService sse,
        Guid orgId, Guid? userId,
        string title, string message, string type = "info", string? link = null,
        CancellationToken ct = default)
    {
        var notification = new AppNotification
        {
            OrganizationId = orgId,
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            Link = link,
        };
        db.AppNotifications.Add(notification);
        await db.SaveChangesAsync(ct);

        // Push to SSE so bell updates in real-time
        await sse.PublishAsync(orgId, "notification", new
        {
            id = notification.Id,
            title, message, type, link,
            createdAt = notification.CreatedAt,
        });
    }
}
