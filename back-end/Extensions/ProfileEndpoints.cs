using System.Security.Claims;
using System.Text.RegularExpressions;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Extensions;

public static class ProfileEndpoints
{
    public static void MapProfileEndpoints(this WebApplication app)
    {
        var profile = app.MapGroup("/api/profile").RequireAuthorization();
        var org = app.MapGroup("/api/org").RequireAuthorization();

        // ── Update Name ───────────────────────────────────────────
        profile.MapPut("/", async (UpdateProfileRequest req, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var userId = principal.GetUserId();
            if (userId is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(req.FirstName) || string.IsNullOrWhiteSpace(req.LastName))
                return Results.BadRequest(new { message = "First and last name are required." });

            var user = await db.Users.FindAsync(new object[] { userId.Value }, ct);
            if (user is null) return Results.Unauthorized();

            user.FirstName = req.FirstName.Trim();
            user.LastName = req.LastName.Trim();
            user.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);

            return Results.Ok(new { firstName = user.FirstName, lastName = user.LastName });
        });

        // ── Change Password ───────────────────────────────────────
        profile.MapPut("/password", async (ChangePasswordRequest req, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var userId = principal.GetUserId();
            if (userId is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(req.CurrentPassword) || string.IsNullOrWhiteSpace(req.NewPassword))
                return Results.BadRequest(new { message = "Both current and new password are required." });

            if (req.NewPassword.Length < 8)
                return Results.BadRequest(new { message = "New password must be at least 8 characters." });

            var user = await db.Users.FindAsync(new object[] { userId.Value }, ct);
            if (user is null) return Results.Unauthorized();

            if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
                return Results.BadRequest(new { message = "Current password is incorrect." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword, workFactor: 12);
            user.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);

            return Results.Ok(new { message = "Password updated successfully." });
        });

        // ── Change Email ──────────────────────────────────────────
        profile.MapPut("/email", async (ChangeEmailRequest req, ClaimsPrincipal principal, AppDbContext db, IAuthService authService, CancellationToken ct) =>
        {
            var userId = principal.GetUserId();
            if (userId is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(req.NewEmail))
                return Results.BadRequest(new { message = "New email is required." });

            if (string.IsNullOrWhiteSpace(req.Password))
                return Results.BadRequest(new { message = "Password confirmation is required." });

            var user = await db.Users.FindAsync(new object[] { userId.Value }, ct);
            if (user is null) return Results.Unauthorized();

            if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Results.BadRequest(new { message = "Password is incorrect." });

            var newEmail = req.NewEmail.ToLowerInvariant().Trim();
            if (await db.Users.AnyAsync(u => u.Email == newEmail && u.Id != userId.Value, ct))
                return Results.BadRequest(new { message = "This email is already in use." });

            user.Email = newEmail;
            user.EmailVerified = false;
            user.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);

            _ = Task.Run(() => authService.ResendVerificationEmailAsync(userId.Value, CancellationToken.None));

            return Results.Ok(new { email = user.Email, emailVerified = false });
        });

        // ── Get Org ───────────────────────────────────────────────
        org.MapGet("/", async (ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var organization = await db.Organizations
                .Include(o => o.Members)
                .FirstOrDefaultAsync(o => o.Id == orgId.Value, ct);
            if (organization is null) return Results.NotFound();

            return Results.Ok(new
            {
                organization.Id,
                organization.Name,
                organization.Slug,
                organization.CreatedAt,
                MemberCount = organization.Members.Count,
            });
        });

        // ── Update Org ────────────────────────────────────────────
        org.MapPut("/", async (UpdateOrgRequest req, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            if (principal.GetRole() != OrgRole.Admin && !principal.IsSuperAdmin())
                return Results.Forbid();

            var organization = await db.Organizations.FindAsync(new object[] { orgId.Value }, ct);
            if (organization is null) return Results.NotFound();

            if (!string.IsNullOrWhiteSpace(req.Name))
                organization.Name = req.Name.Trim();

            if (!string.IsNullOrWhiteSpace(req.Slug))
            {
                var newSlug = Regex.Replace(req.Slug.ToLowerInvariant().Trim(), @"[^a-z0-9]+", "-").Trim('-');
                if (string.IsNullOrEmpty(newSlug))
                    return Results.BadRequest(new { message = "Slug must contain at least one alphanumeric character." });
                if (await db.Organizations.AnyAsync(o => o.Slug == newSlug && o.Id != orgId.Value, ct))
                    return Results.BadRequest(new { message = "This slug is already taken." });
                organization.Slug = newSlug;
            }

            organization.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);

            return Results.Ok(new { organization.Id, organization.Name, organization.Slug });
        });

        // ── List Active Sessions ──────────────────────────────────
        profile.MapGet("/sessions", async (ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var userId = principal.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var sessions = await db.RefreshTokens
                .Where(r => r.UserId == userId.Value && r.RevokedAt == null && r.ExpiresAt > DateTime.UtcNow)
                .OrderByDescending(r => r.LastUsedAt ?? r.CreatedAt)
                .Select(r => new
                {
                    r.Id,
                    r.IpAddress,
                    r.UserAgent,
                    r.CreatedAt,
                    LastUsedAt = r.LastUsedAt ?? r.CreatedAt,
                    r.ExpiresAt,
                })
                .ToListAsync(ct);

            return Results.Ok(sessions);
        });

        // ── Revoke Session ────────────────────────────────────────
        profile.MapDelete("/sessions/{id:guid}", async (Guid id, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var userId = principal.GetUserId();
            if (userId is null) return Results.Unauthorized();

            var token = await db.RefreshTokens
                .FirstOrDefaultAsync(r => r.Id == id && r.UserId == userId.Value, ct);
            if (token is null) return Results.NotFound();

            token.RevokedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return Results.Ok(new { message = "Session revoked." });
        });

        // ── Revoke All Other Sessions ─────────────────────────────
        profile.MapDelete("/sessions", async ([Microsoft.AspNetCore.Mvc.FromBody] RevokeOthersRequest req, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var userId = principal.GetUserId();
            if (userId is null) return Results.Unauthorized();

            // Hash the current refresh token to exclude it from revocation
            var query = db.RefreshTokens
                .Where(r => r.UserId == userId.Value && r.RevokedAt == null);

            if (!string.IsNullOrEmpty(req.CurrentRefreshToken))
            {
                // Keep the current session alive
                var currentHash = req.CurrentRefreshToken; // caller passes the raw token or just "keep-current"
                query = query.Where(r => r.TokenHash != currentHash);
            }

            await query.ExecuteUpdateAsync(s => s.SetProperty(r => r.RevokedAt, DateTime.UtcNow), ct);
            return Results.Ok(new { message = "All other sessions revoked." });
        });

        // ── Delete Org ────────────────────────────────────────────
        org.MapDelete("/", async ([Microsoft.AspNetCore.Mvc.FromBody] DeleteOrgRequest req, ClaimsPrincipal principal, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            var userId = principal.GetUserId();
            if (orgId is null || userId is null) return Results.Unauthorized();

            if (principal.GetRole() != OrgRole.Admin)
                return Results.Forbid();

            var user = await db.Users.FindAsync(new object[] { userId.Value }, ct);
            if (user is null) return Results.Unauthorized();

            if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
                return Results.BadRequest(new { message = "Password is incorrect." });

            var organization = await db.Organizations.FindAsync(new object[] { orgId.Value }, ct);
            if (organization is null) return Results.NotFound();

            db.Organizations.Remove(organization);
            await db.SaveChangesAsync(ct);

            return Results.Ok(new { message = "Organization deleted." });
        });
    }

    private record RevokeOthersRequest(string? CurrentRefreshToken);
    private record UpdateProfileRequest(string FirstName, string LastName);
    private record ChangePasswordRequest(string CurrentPassword, string NewPassword);
    private record ChangeEmailRequest(string NewEmail, string Password);
    private record UpdateOrgRequest(string? Name, string? Slug);
    private record DeleteOrgRequest(string Password);
}
