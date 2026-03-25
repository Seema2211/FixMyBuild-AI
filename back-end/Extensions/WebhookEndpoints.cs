using System.Security.Claims;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Extensions;

public static class WebhookEndpoints
{
    private static readonly string[] ValidEvents = ["failure.created", "failure.analyzed", "failure.resolved"];

    public static void MapWebhookEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/webhooks").RequireAuthorization();

        // GET /api/webhooks
        group.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var webhooks = await db.OutboundWebhooks
                .Where(w => w.OrganizationId == orgId.Value)
                .OrderByDescending(w => w.CreatedAt)
                .Select(w => new
                {
                    w.Id, w.Name, w.Url, w.Events, w.IsActive, w.CreatedAt,
                    HasSecret = w.Secret != null,
                    RecentDeliveries = w.Deliveries
                        .OrderByDescending(d => d.CreatedAt).Take(5)
                        .Select(d => new { d.Id, d.Event, d.StatusCode, d.Success, d.AttemptCount, d.CreatedAt })
                })
                .ToListAsync(ct);

            return Results.Ok(webhooks);
        });

        // POST /api/webhooks
        group.MapPost("/", async (CreateWebhookRequest req, ClaimsPrincipal principal, AppDbContext db,
            ISubscriptionService subscriptionService, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();
            if (principal.GetRole() != OrgRole.Admin && !principal.IsSuperAdmin()) return Results.Forbid();

            if (!principal.IsSuperAdmin())
            {
                try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.Notifications); }
                catch (PlanLimitException ex) { return ApiErrors.PlanLimit(ex); }
            }

            if (string.IsNullOrWhiteSpace(req.Url) || !Uri.TryCreate(req.Url, UriKind.Absolute, out _))
                return Results.BadRequest(new { message = "A valid webhook URL is required." });

            var events = req.Events?.Where(e => ValidEvents.Contains(e)).ToList() ?? [.. ValidEvents];

            var webhook = new OutboundWebhook
            {
                OrganizationId = orgId.Value,
                Name = req.Name?.Trim() ?? "Webhook",
                Url = req.Url.Trim(),
                Secret = string.IsNullOrWhiteSpace(req.Secret) ? null : req.Secret.Trim(),
                Events = events,
                IsActive = true,
            };

            db.OutboundWebhooks.Add(webhook);
            await db.SaveChangesAsync(ct);

            return Results.Created($"/api/webhooks/{webhook.Id}", new
            {
                webhook.Id, webhook.Name, webhook.Url, webhook.Events, webhook.IsActive, webhook.CreatedAt,
                HasSecret = webhook.Secret != null
            });
        });

        // PATCH /api/webhooks/{id}
        group.MapPatch("/{id:guid}", async (Guid id, UpdateWebhookRequest req, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();
            if (principal.GetRole() != OrgRole.Admin && !principal.IsSuperAdmin()) return Results.Forbid();

            var webhook = await db.OutboundWebhooks
                .FirstOrDefaultAsync(w => w.Id == id && w.OrganizationId == orgId.Value, ct);
            if (webhook is null) return Results.NotFound();

            if (req.Name is not null) webhook.Name = req.Name.Trim();
            if (req.IsActive is not null) webhook.IsActive = req.IsActive.Value;
            if (req.Events is not null) webhook.Events = req.Events.Where(e => ValidEvents.Contains(e)).ToList();

            await db.SaveChangesAsync(ct);
            return Results.Ok(new { webhook.Id, webhook.Name, webhook.Url, webhook.Events, webhook.IsActive });
        });

        // DELETE /api/webhooks/{id}
        group.MapDelete("/{id:guid}", async (Guid id, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();
            if (principal.GetRole() != OrgRole.Admin && !principal.IsSuperAdmin()) return Results.Forbid();

            var webhook = await db.OutboundWebhooks
                .FirstOrDefaultAsync(w => w.Id == id && w.OrganizationId == orgId.Value, ct);
            if (webhook is null) return Results.NotFound();

            db.OutboundWebhooks.Remove(webhook);
            await db.SaveChangesAsync(ct);
            return Results.Ok();
        });

        // GET /api/webhooks/{id}/deliveries
        group.MapGet("/{id:guid}/deliveries", async (Guid id, ClaimsPrincipal principal, AppDbContext db,
            int page = 1, int pageSize = 20, CancellationToken ct = default) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var exists = await db.OutboundWebhooks.AnyAsync(w => w.Id == id && w.OrganizationId == orgId.Value, ct);
            if (!exists) return Results.NotFound();

            var total = await db.WebhookDeliveries.CountAsync(d => d.WebhookId == id, ct);
            var items = await db.WebhookDeliveries
                .Where(d => d.WebhookId == id)
                .OrderByDescending(d => d.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(d => new { d.Id, d.Event, d.StatusCode, d.Success, d.AttemptCount, d.ErrorMessage, d.CreatedAt })
                .ToListAsync(ct);

            return Results.Ok(new { total, page, pageSize, items });
        });

        // POST /api/webhooks/{id}/test
        group.MapPost("/{id:guid}/test", async (Guid id, ClaimsPrincipal principal, AppDbContext db,
            IWebhookDeliveryService deliveryService, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var exists = await db.OutboundWebhooks.AnyAsync(w => w.Id == id && w.OrganizationId == orgId.Value, ct);
            if (!exists) return Results.NotFound();

            await deliveryService.DeliverAsync(orgId.Value, "webhook.test",
                new { message = "This is a test delivery from FixMyBuild" }, ct);

            return Results.Ok(new { message = "Test delivery queued." });
        });
    }

    private record CreateWebhookRequest(string? Name, string Url, string? Secret, List<string>? Events);
    private record UpdateWebhookRequest(string? Name, bool? IsActive, List<string>? Events);
}
