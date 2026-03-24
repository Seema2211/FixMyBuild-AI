using System.Security.Cryptography;
using System.Text.RegularExpressions;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly ITokenService _tokens;
    private readonly IConfiguration _config;
    private readonly IEmailSenderService _emailSender;

    public AuthService(AppDbContext db, ITokenService tokens, IConfiguration config, IEmailSenderService emailSender)
    {
        _db = db;
        _tokens = tokens;
        _config = config;
        _emailSender = emailSender;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest req, CancellationToken ct = default)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLowerInvariant(), ct))
            throw new InvalidOperationException("An account with this email already exists.");

        if (req.Password.Length < 8)
            throw new InvalidOperationException("Password must be at least 8 characters.");

        var user = new User
        {
            Email = req.Email.ToLowerInvariant().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12),
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
        };
        _db.Users.Add(user);

        var org = new Organization
        {
            Name = req.OrganizationName.Trim(),
            Slug = await GenerateUniqueSlugAsync(req.OrganizationName, ct),
        };
        _db.Organizations.Add(org);

        // Auto-create Free subscription for new organization
        _db.Subscriptions.Add(new Subscription
        {
            OrganizationId = org.Id,
            Plan = PlanType.Free,
            Status = SubscriptionStatus.Active,
        });

        var membership = new OrganizationMember
        {
            UserId = user.Id,
            OrganizationId = org.Id,
            Role = OrgRole.Admin,
        };
        _db.OrganizationMembers.Add(membership);

        await _db.SaveChangesAsync(ct);

        // Best-effort verification email — don't fail registration if SMTP not set up
        _ = Task.Run(() => SendVerificationEmailInternalAsync(user, org.Id, CancellationToken.None));

        return await IssueTokensAsync(user, org.Id, OrgRole.Admin, ct);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest req, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLowerInvariant(), ct);
        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        var membership = await _db.OrganizationMembers
            .Include(m => m.Organization)
            .FirstOrDefaultAsync(m => m.UserId == user.Id, ct)
            ?? throw new InvalidOperationException("User has no organization.");

        return await IssueTokensAsync(user, membership.OrganizationId, membership.Role, ct);
    }

    public async Task<AuthResponse> RefreshAsync(string rawRefreshToken, CancellationToken ct = default)
    {
        var tokenHash = _tokens.HashToken(rawRefreshToken);
        var stored = await _db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.TokenHash == tokenHash, ct);

        if (stored is null || !stored.IsActive)
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");

        var membership = await _db.OrganizationMembers
            .FirstOrDefaultAsync(m => m.UserId == stored.UserId, ct)
            ?? throw new InvalidOperationException("User has no organization.");

        stored.RevokedAt = DateTime.UtcNow;

        var response = await IssueTokensAsync(stored.User, membership.OrganizationId, membership.Role, ct);

        var newHash = _tokens.HashToken(response.RefreshToken);
        stored.ReplacedByTokenHash = newHash;
        await _db.SaveChangesAsync(ct);

        return response;
    }

    public async Task LogoutAsync(string rawRefreshToken, CancellationToken ct = default)
    {
        var tokenHash = _tokens.HashToken(rawRefreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == tokenHash, ct);
        if (stored is not null && stored.IsActive)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct);
        if (user is null) return null;

        var membership = await _db.OrganizationMembers
            .Include(m => m.Organization)
            .FirstOrDefaultAsync(m => m.UserId == userId, ct);
        if (membership is null) return null;

        return new UserDto(user.Id, user.Email, user.FirstName, user.LastName,
            membership.OrganizationId, membership.Organization.Name, membership.Role, user.EmailVerified);
    }

    public async Task<AuthResponse> AcceptInviteAsync(AcceptInviteRequest req, CancellationToken ct = default)
    {
        var tokenHash = _tokens.HashToken(req.InviteToken);
        var invite = await _db.Invitations
            .Include(i => i.Organization)
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash, ct);

        if (invite is null || invite.IsRevoked || invite.AcceptedAt.HasValue)
            throw new InvalidOperationException("Invitation is invalid or has already been used.");

        if (invite.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Invitation has expired.");

        if (await _db.Users.AnyAsync(u => u.Email == req.Email.ToLowerInvariant(), ct))
            throw new InvalidOperationException("An account with this email already exists.");

        if (req.Password.Length < 8)
            throw new InvalidOperationException("Password must be at least 8 characters.");

        var user = new User
        {
            Email = req.Email.ToLowerInvariant().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12),
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
        };
        _db.Users.Add(user);

        var membership = new OrganizationMember
        {
            UserId = user.Id,
            OrganizationId = invite.OrganizationId,
            Role = invite.Role,
        };
        _db.OrganizationMembers.Add(membership);

        invite.AcceptedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        _ = Task.Run(() => SendVerificationEmailInternalAsync(user, invite.OrganizationId, CancellationToken.None));

        return await IssueTokensAsync(user, invite.OrganizationId, invite.Role, ct);
    }

    // ── Password Reset ────────────────────────────────────────────

    public async Task ForgotPasswordAsync(string email, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email.ToLowerInvariant(), ct);
        if (user is null) return; // Don't reveal whether the email exists

        var membership = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.UserId == user.Id, ct);
        if (membership is null) return;

        // Invalidate any existing reset tokens
        var existing = await _db.UserTokens
            .Where(t => t.UserId == user.Id && t.Type == UserTokenType.PasswordReset && t.UsedAt == null)
            .ToListAsync(ct);
        foreach (var t in existing) t.UsedAt = DateTime.UtcNow;

        var rawToken = GenerateRawToken();
        _db.UserTokens.Add(new UserToken
        {
            UserId = user.Id,
            Type = UserTokenType.PasswordReset,
            TokenHash = _tokens.HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        });
        await _db.SaveChangesAsync(ct);

        var link = $"{FrontEndUrl()}/reset-password?token={rawToken}";
        await _emailSender.SendAsync(user.Email, "Reset your FixMyBuild password",
            ResetPasswordEmail(link), membership.OrganizationId, ct);
    }

    public async Task ResetPasswordAsync(string rawToken, string newPassword, CancellationToken ct = default)
    {
        if (newPassword.Length < 8)
            throw new InvalidOperationException("Password must be at least 8 characters.");

        var tokenHash = _tokens.HashToken(rawToken);
        var token = await _db.UserTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.Type == UserTokenType.PasswordReset, ct);

        if (token is null || token.UsedAt.HasValue || token.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Reset link is invalid or has expired.");

        token.User.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword, workFactor: 12);
        token.User.UpdatedAt = DateTime.UtcNow;
        token.UsedAt = DateTime.UtcNow;

        // Revoke all active refresh tokens for security
        var refreshTokens = await _db.RefreshTokens
            .Where(r => r.UserId == token.UserId && r.RevokedAt == null)
            .ToListAsync(ct);
        foreach (var rt in refreshTokens) rt.RevokedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }

    // ── Email Verification ────────────────────────────────────────

    public async Task VerifyEmailAsync(string rawToken, CancellationToken ct = default)
    {
        var tokenHash = _tokens.HashToken(rawToken);
        var token = await _db.UserTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.Type == UserTokenType.EmailVerify, ct);

        if (token is null || token.UsedAt.HasValue || token.ExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Verification link is invalid or has expired.");

        token.User.EmailVerified = true;
        token.User.UpdatedAt = DateTime.UtcNow;
        token.UsedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task ResendVerificationEmailAsync(Guid userId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync(new object[] { userId }, ct)
            ?? throw new InvalidOperationException("User not found.");

        if (user.EmailVerified)
            throw new InvalidOperationException("Email is already verified.");

        var membership = await _db.OrganizationMembers.FirstOrDefaultAsync(m => m.UserId == userId, ct)
            ?? throw new InvalidOperationException("User has no organization.");

        await SendVerificationEmailInternalAsync(user, membership.OrganizationId, ct);
    }

    // ── Helpers ──────────────────────────────────────────────────

    private async Task SendVerificationEmailInternalAsync(User user, Guid orgId, CancellationToken ct)
    {
        try
        {
            // Invalidate existing verify tokens
            var existing = await _db.UserTokens
                .Where(t => t.UserId == user.Id && t.Type == UserTokenType.EmailVerify && t.UsedAt == null)
                .ToListAsync(ct);
            foreach (var t in existing) t.UsedAt = DateTime.UtcNow;

            var rawToken = GenerateRawToken();
            _db.UserTokens.Add(new UserToken
            {
                UserId = user.Id,
                Type = UserTokenType.EmailVerify,
                TokenHash = _tokens.HashToken(rawToken),
                ExpiresAt = DateTime.UtcNow.AddDays(7),
            });
            await _db.SaveChangesAsync(ct);

            var link = $"{FrontEndUrl()}/verify-email?token={rawToken}";
            await _emailSender.SendAsync(user.Email, "Verify your FixMyBuild email",
                VerifyEmailBody(link), orgId, ct);
        }
        catch
        {
            // Best-effort — don't crash registration/invite flows if SMTP isn't set up
        }
    }

    private async Task<AuthResponse> IssueTokensAsync(User user, Guid orgId, string role, CancellationToken ct)
    {
        var accessToken = _tokens.GenerateAccessToken(user, orgId, role);
        var (rawRefresh, refreshHash) = _tokens.GenerateRefreshToken();
        var expiryDays = int.Parse(_config["Jwt:RefreshTokenExpiryDays"] ?? "30");

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshHash,
            ExpiresAt = DateTime.UtcNow.AddDays(expiryDays),
        };
        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync(ct);

        var membership = await _db.OrganizationMembers
            .Include(m => m.Organization)
            .FirstOrDefaultAsync(m => m.UserId == user.Id, ct);

        return new AuthResponse(
            AccessToken: accessToken,
            RefreshToken: rawRefresh,
            User: new UserDto(user.Id, user.Email, user.FirstName, user.LastName,
                orgId, membership?.Organization.Name ?? "", role, user.EmailVerified)
        );
    }

    private static string GenerateRawToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace("+", "-").Replace("/", "_").Replace("=", "");

    private string FrontEndUrl() =>
        _config["AppSettings:FrontEndUrl"] ?? "http://localhost:4200";

    private async Task<string> GenerateUniqueSlugAsync(string name, CancellationToken ct)
    {
        var baseSlug = Regex.Replace(name.ToLowerInvariant().Trim(), @"[^a-z0-9]+", "-").Trim('-');
        var slug = baseSlug;
        var counter = 1;
        while (await _db.Organizations.AnyAsync(o => o.Slug == slug, ct))
            slug = $"{baseSlug}-{counter++}";
        return slug;
    }

    // ── Email Templates ──────────────────────────────────────────

    private static string ResetPasswordEmail(string link) => $"""
        <!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:40px 20px;margin:0">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <p style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 24px">FixMyBuild AI</p>
          <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px">Reset your password</h2>
          <p style="color:#6b7280;margin:0 0 28px">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
          <a href="{link}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">Reset Password</a>
          <p style="margin-top:28px;color:#9ca3af;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div></body></html>
        """;

    private static string VerifyEmailBody(string link) => $"""
        <!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:40px 20px;margin:0">
        <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <p style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 24px">FixMyBuild AI</p>
          <h2 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 8px">Verify your email</h2>
          <p style="color:#6b7280;margin:0 0 28px">Click the button below to verify your email address. This link expires in <strong>7 days</strong>.</p>
          <a href="{link}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px">Verify Email</a>
          <p style="margin-top:28px;color:#9ca3af;font-size:13px">If you didn't create a FixMyBuild account, you can safely ignore this email.</p>
        </div></body></html>
        """;
}
