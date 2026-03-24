namespace FixMyBuildApi.Services;

public interface IAuditService
{
    Task LogAsync(
        string action,
        Guid orgId,
        Guid? userId = null,
        string? actorEmail = null,
        string? targetEmail = null,
        string? details = null,
        CancellationToken ct = default);
}
