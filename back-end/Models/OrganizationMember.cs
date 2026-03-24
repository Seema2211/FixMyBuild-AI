namespace FixMyBuildApi.Models;

public class OrganizationMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = OrgRole.Developer;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public Organization Organization { get; set; } = null!;
    public User User { get; set; } = null!;
}

public static class OrgRole
{
    public const string Admin = "admin";
    public const string Developer = "developer";
    public const string Viewer = "viewer";
}
