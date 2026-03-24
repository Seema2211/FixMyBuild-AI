using FixMyBuildApi.Data;
using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public class AuditService : IAuditService
{
    private readonly AppDbContext _db;

    public AuditService(AppDbContext db) => _db = db;

    public async Task LogAsync(
        string action,
        Guid orgId,
        Guid? userId = null,
        string? actorEmail = null,
        string? targetEmail = null,
        string? details = null,
        CancellationToken ct = default)
    {
        _db.AuditLogs.Add(new AuditLog
        {
            OrganizationId = orgId,
            UserId = userId,
            Action = action,
            ActorEmail = actorEmail,
            TargetEmail = targetEmail,
            Details = details,
        });
        await _db.SaveChangesAsync(ct);
    }
}
