using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public record RegisterRequest(string Email, string Password, string FirstName, string LastName, string OrganizationName);
public record AcceptInviteRequest(string InviteToken, string Email, string Password, string FirstName, string LastName);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string AccessToken, string RefreshToken, UserDto User);
public record UserDto(Guid Id, string Email, string FirstName, string LastName, Guid OrganizationId, string OrganizationName, string Role, bool EmailVerified = false, bool IsSuperAdmin = false);
public record RefreshRequest(string RefreshToken);

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default, string? ipAddress = null, string? userAgent = null);
    Task<AuthResponse> RefreshAsync(string rawRefreshToken, CancellationToken ct = default);
    Task LogoutAsync(string rawRefreshToken, CancellationToken ct = default);
    Task<UserDto?> GetCurrentUserAsync(Guid userId, CancellationToken ct = default);
    Task<AuthResponse> AcceptInviteAsync(AcceptInviteRequest request, CancellationToken ct = default);
    Task ForgotPasswordAsync(string email, CancellationToken ct = default);
    Task ResetPasswordAsync(string rawToken, string newPassword, CancellationToken ct = default);
    Task VerifyEmailAsync(string rawToken, CancellationToken ct = default);
    Task ResendVerificationEmailAsync(Guid userId, CancellationToken ct = default);
}
