using System.Security.Claims;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services;
using Microsoft.AspNetCore.Mvc;

namespace FixMyBuildApi.Extensions;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/auth");

        // ── Register ─────────────────────────────────────────────
        group.MapPost("/register", async (RegisterRequest req, IAuthService authService, IAuditService auditService, CancellationToken ct) =>
        {
            try
            {
                var response = await authService.RegisterAsync(req, ct);
                await auditService.LogAsync(AuditActions.UserRegistered, response.User.OrganizationId, response.User.Id, response.User.Email, ct: ct);
                return Results.Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        });

        // ── Login ────────────────────────────────────────────────
        group.MapPost("/login", async (HttpContext context, LoginRequest req, IAuthService authService, IAuditService auditService, CancellationToken ct) =>
        {
            try
            {
                var ip = context.Connection.RemoteIpAddress?.ToString();
                var ua = context.Request.Headers.UserAgent.ToString();
                var response = await authService.LoginAsync(req, ct, ip, ua);
                await auditService.LogAsync(AuditActions.UserLogin, response.User.OrganizationId, response.User.Id, response.User.Email, ct: ct);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        });

        // ── Refresh ──────────────────────────────────────────────
        group.MapPost("/refresh", async (RefreshRequest req, IAuthService authService, CancellationToken ct) =>
        {
            try
            {
                var response = await authService.RefreshAsync(req.RefreshToken, ct);
                return Results.Ok(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Results.Unauthorized();
            }
        });

        // ── Logout ───────────────────────────────────────────────
        group.MapPost("/logout", async (RefreshRequest req, IAuthService authService, CancellationToken ct) =>
        {
            await authService.LogoutAsync(req.RefreshToken, ct);
            return Results.Ok(new { message = "Logged out successfully." });
        });

        // ── Accept Invite ────────────────────────────────────────
        group.MapPost("/accept-invite", async (AcceptInviteRequest req, IAuthService authService, IAuditService auditService, CancellationToken ct) =>
        {
            try
            {
                var response = await authService.AcceptInviteAsync(req, ct);
                await auditService.LogAsync(AuditActions.InviteAccepted, response.User.OrganizationId, response.User.Id, response.User.Email, ct: ct);
                return Results.Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        });

        // ── Forgot Password ──────────────────────────────────────
        group.MapPost("/forgot-password", async (ForgotPasswordRequest req, IAuthService authService, CancellationToken ct) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email))
                return Results.BadRequest(new { message = "Email is required." });
            try
            {
                await authService.ForgotPasswordAsync(req.Email.Trim(), ct);
            }
            catch
            {
                // Swallow errors — always return 200 to avoid email enumeration
            }
            return Results.Ok(new { message = "If that email exists, a reset link has been sent." });
        });

        // ── Reset Password ────────────────────────────────────────
        group.MapPost("/reset-password", async (ResetPasswordRequest req, IAuthService authService, CancellationToken ct) =>
        {
            try
            {
                await authService.ResetPasswordAsync(req.Token, req.NewPassword, ct);
                return Results.Ok(new { message = "Password updated. Please log in." });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        });

        // ── Verify Email ──────────────────────────────────────────
        group.MapPost("/verify-email", async (VerifyEmailRequest req, IAuthService authService, CancellationToken ct) =>
        {
            try
            {
                await authService.VerifyEmailAsync(req.Token, ct);
                return Results.Ok(new { message = "Email verified successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        });

        // ── Resend Verification ───────────────────────────────────
        group.MapPost("/resend-verification", async (ClaimsPrincipal principal, IAuthService authService, CancellationToken ct) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.FindFirstValue("sub");
            if (!Guid.TryParse(userIdStr, out var userId))
                return Results.Unauthorized();
            try
            {
                await authService.ResendVerificationEmailAsync(userId, ct);
                return Results.Ok(new { message = "Verification email sent." });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new { message = ex.Message });
            }
        }).RequireAuthorization();

        // ── Me ───────────────────────────────────────────────────
        group.MapGet("/me", async (ClaimsPrincipal principal, IAuthService authService, CancellationToken ct) =>
        {
            var userIdStr = principal.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? principal.FindFirstValue("sub");
            if (!Guid.TryParse(userIdStr, out var userId))
                return Results.Unauthorized();

            var user = await authService.GetCurrentUserAsync(userId, ct);
            return user is null ? Results.Unauthorized() : Results.Ok(user);
        }).RequireAuthorization();
    }

    private record ForgotPasswordRequest(string Email);
    private record ResetPasswordRequest(string Token, string NewPassword);
    private record VerifyEmailRequest(string Token);
}
