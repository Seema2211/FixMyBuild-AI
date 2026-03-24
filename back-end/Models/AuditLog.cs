namespace FixMyBuildApi.Models;

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? ActorEmail { get; set; }
    public string? TargetEmail { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public static class AuditActions
{
    public const string UserRegistered  = "user.registered";
    public const string UserLogin       = "user.login";
    public const string InviteSent      = "invite.sent";
    public const string InviteAccepted  = "invite.accepted";
    public const string InviteRevoked   = "invite.revoked";
    public const string MemberRoleChanged = "member.role_changed";
    public const string MemberRemoved   = "member.removed";
    public const string ApiKeyCreated   = "apikey.created";
    public const string ApiKeyRevoked   = "apikey.revoked";
}
