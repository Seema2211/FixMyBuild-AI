namespace FixMyBuildApi.Models;

public class ApiKey
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrganizationId { get; set; }
    public string Name { get; set; } = string.Empty;           // "Production CI", "Staging"
    public string KeyPrefix { get; set; } = string.Empty;      // "fmb_live_a3f9k2xm" (first 16 chars — shown in UI)
    public string KeyHash { get; set; } = string.Empty;        // SHA-256 of full key — never stored in plaintext
    public DateTime? LastUsedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public Organization Organization { get; set; } = null!;
}
