using System.Security.Claims;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services;
using Microsoft.EntityFrameworkCore;
using ClaimTypes = System.Security.Claims.ClaimTypes;

namespace FixMyBuildApi.Extensions;

public static class TeamEndpoints
{
    public static void MapTeamEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/team").RequireAuthorization();

        // ── Members ───────────────────────────────────────────────

        group.MapGet("/members", async (ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var members = await db.OrganizationMembers
                .Include(m => m.User)
                .Where(m => m.OrganizationId == orgId.Value)
                .OrderBy(m => m.JoinedAt)
                .ToListAsync(ct);

            return Results.Ok(members.Select(m => new
            {
                m.Id,
                m.UserId,
                m.Role,
                m.JoinedAt,
                User = new { m.User.Email, m.User.FirstName, m.User.LastName },
            }));
        });

        group.MapPut("/members/{userId:guid}/role", async (
            Guid userId, RoleUpdateRequest req,
            ClaimsPrincipal user, AppDbContext db, IAuditService auditService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();
            if (!IsAdmin(user)) return Results.Forbid();

            if (!new[] { OrgRole.Admin, OrgRole.Developer, OrgRole.Viewer }.Contains(req.Role))
                return Results.BadRequest("Invalid role. Use admin, developer, or viewer.");

            var member = await db.OrganizationMembers
                .FirstOrDefaultAsync(m => m.UserId == userId && m.OrganizationId == orgId.Value, ct);
            if (member is null) return Results.NotFound();

            // Prevent removing last admin
            if (member.Role == OrgRole.Admin && req.Role != OrgRole.Admin)
            {
                var adminCount = await db.OrganizationMembers
                    .CountAsync(m => m.OrganizationId == orgId.Value && m.Role == OrgRole.Admin, ct);
                if (adminCount <= 1)
                    return Results.BadRequest("Cannot demote the last admin.");
            }

            member.Role = req.Role;
            await db.SaveChangesAsync(ct);
            var actorEmail = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");
            await auditService.LogAsync(AuditActions.MemberRoleChanged, orgId.Value, user.GetUserId(), actorEmail, details: $"{userId} → {req.Role}", ct: ct);
            return Results.Ok(new { member.UserId, member.Role });
        });

        group.MapDelete("/members/{userId:guid}", async (
            Guid userId, ClaimsPrincipal user, AppDbContext db, IAuditService auditService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();
            if (!IsAdmin(user)) return Results.Forbid();

            var currentUserId = Guid.Parse(user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value ?? Guid.Empty.ToString());
            if (userId == currentUserId)
                return Results.BadRequest("You cannot remove yourself.");

            var member = await db.OrganizationMembers
                .FirstOrDefaultAsync(m => m.UserId == userId && m.OrganizationId == orgId.Value, ct);
            if (member is null) return Results.NotFound();

            db.OrganizationMembers.Remove(member);
            await db.SaveChangesAsync(ct);
            var actorEmailR = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");
            await auditService.LogAsync(AuditActions.MemberRemoved, orgId.Value, user.GetUserId(), actorEmailR, details: userId.ToString(), ct: ct);
            return Results.NoContent();
        });

        // ── Invitations ───────────────────────────────────────────

        group.MapGet("/invitations", async (ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var invites = await db.Invitations
                .Include(i => i.InvitedBy)
                .Where(i => i.OrganizationId == orgId.Value && !i.IsRevoked && i.AcceptedAt == null)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync(ct);

            return Results.Ok(invites.Select(i => new
            {
                i.Id,
                i.Email,
                i.Role,
                i.ExpiresAt,
                i.CreatedAt,
                IsExpired = i.ExpiresAt < DateTime.UtcNow,
                InvitedBy = $"{i.InvitedBy.FirstName} {i.InvitedBy.LastName}",
            }));
        });

        group.MapPost("/invitations", async (
            InviteRequest req, ClaimsPrincipal user,
            AppDbContext db, ITokenService tokenService, IAuditService auditService, ISubscriptionService subscriptionService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();
            if (!IsAdmin(user)) return Results.Forbid();

            if (string.IsNullOrWhiteSpace(req.Email))
                return Results.BadRequest("Email is required.");

            if (!user.IsSuperAdmin())
            {
                try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.Members); }
                catch (PlanLimitException ex)
                {
                    return ApiErrors.PlanLimit(ex);
                }
            }

            var role = req.Role?.ToLower() switch
            {
                "admin" => OrgRole.Admin,
                "viewer" => OrgRole.Viewer,
                _ => OrgRole.Developer,
            };

            // Generate a secure random token
            var rawToken = Convert.ToBase64String(
                System.Security.Cryptography.RandomNumberGenerator.GetBytes(32))
                .Replace("+", "-").Replace("/", "_").Replace("=", "");
            var tokenHash = tokenService.HashToken(rawToken);

            var invitedByUserId = Guid.Parse(user.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value ?? Guid.Empty.ToString());

            var invitation = new Invitation
            {
                OrganizationId = orgId.Value,
                Email = req.Email.Trim().ToLowerInvariant(),
                TokenHash = tokenHash,
                Role = role,
                InvitedByUserId = invitedByUserId,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
            };

            db.Invitations.Add(invitation);
            await db.SaveChangesAsync(ct);
            var inviterEmail = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");
            await auditService.LogAsync(AuditActions.InviteSent, orgId.Value, invitedByUserId, inviterEmail, invitation.Email, ct: ct);

            return Results.Created($"/api/team/invitations/{invitation.Id}", new
            {
                invitation.Id,
                invitation.Email,
                invitation.Role,
                invitation.ExpiresAt,
                InviteToken = rawToken,   // front-end builds the invite link from this
            });
        });

        group.MapDelete("/invitations/{id:guid}", async (
            Guid id, ClaimsPrincipal user, AppDbContext db, IAuditService auditService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();
            if (!IsAdmin(user)) return Results.Forbid();

            var invite = await db.Invitations
                .FirstOrDefaultAsync(i => i.Id == id && i.OrganizationId == orgId.Value, ct);
            if (invite is null) return Results.NotFound();

            invite.IsRevoked = true;
            await db.SaveChangesAsync(ct);
            var revokerEmail = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");
            await auditService.LogAsync(AuditActions.InviteRevoked, orgId.Value, user.GetUserId(), revokerEmail, invite.Email, ct: ct);
            return Results.NoContent();
        });

        // ── Public: preview invite ────────────────────────────────

        app.MapGet("/api/invitations/preview", async (string token, AppDbContext db, CancellationToken ct) =>
        {
            if (string.IsNullOrEmpty(token)) return Results.BadRequest("token is required.");

            var tokenHash = System.Security.Cryptography.SHA256.HashData(
                System.Text.Encoding.UTF8.GetBytes(token));
            var tokenHashHex = Convert.ToHexString(tokenHash).ToLowerInvariant();

            var invite = await db.Invitations
                .Include(i => i.Organization)
                .FirstOrDefaultAsync(i => i.TokenHash == tokenHashHex, ct);

            if (invite is null || invite.IsRevoked)
                return Results.NotFound(new { error = "Invitation not found or revoked." });

            if (invite.AcceptedAt.HasValue)
                return Results.BadRequest(new { error = "Invitation has already been accepted." });

            if (invite.ExpiresAt < DateTime.UtcNow)
                return Results.BadRequest(new { error = "Invitation has expired." });

            return Results.Ok(new
            {
                invite.Email,
                invite.Role,
                OrgName = invite.Organization.Name,
                invite.ExpiresAt,
            });
        });
    }

    private static bool IsAdmin(ClaimsPrincipal user) =>
        user.GetRole() == OrgRole.Admin;

    // ── DTOs ─────────────────────────────────────────────────────

    private class InviteRequest
    {
        public string Email { get; set; } = "";
        public string? Role { get; set; }
    }

    private class RoleUpdateRequest
    {
        public string Role { get; set; } = "";
    }
}
