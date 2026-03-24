namespace FixMyBuildApi.Models;

public class UserToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;       // "password_reset" | "email_verify"
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
}

public static class UserTokenType
{
    public const string PasswordReset = "password_reset";
    public const string EmailVerify   = "email_verify";
}
