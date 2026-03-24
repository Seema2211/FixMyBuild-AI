using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public interface IConfigurationService
{
    // Pipeline Sources
    Task<List<PipelineSource>> GetAllSourcesAsync(Guid orgId, CancellationToken ct = default);
    Task<PipelineSource?> GetSourceByIdAsync(int id, Guid orgId, CancellationToken ct = default);
    Task<PipelineSource> CreateSourceAsync(PipelineSource source, Guid orgId, CancellationToken ct = default);
    Task<PipelineSource?> UpdateSourceAsync(int id, PipelineSource source, Guid orgId, CancellationToken ct = default);
    Task<bool> DeleteSourceAsync(int id, Guid orgId, CancellationToken ct = default);
    Task<bool> TestSourceConnectionAsync(int id, Guid orgId, CancellationToken ct = default);

    // Connected Repositories
    Task<List<ConnectedRepository>> GetRepositoriesAsync(int sourceId, Guid orgId, CancellationToken ct = default);
    Task<ConnectedRepository> AddRepositoryAsync(int sourceId, ConnectedRepository repo, Guid orgId, CancellationToken ct = default);
    Task<ConnectedRepository?> UpdateRepositoryAsync(int repoId, ConnectedRepository repo, Guid orgId, CancellationToken ct = default);
    Task<bool> RemoveRepositoryAsync(int repoId, Guid orgId, CancellationToken ct = default);

    // For background worker (no org scope — uses per-source token)
    Task<List<(ConnectedRepository Repo, string Token)>> GetActiveReposWithTokensAsync(CancellationToken ct = default);

    // API Keys
    Task<List<ApiKey>> GetApiKeysAsync(Guid orgId, CancellationToken ct = default);
    Task<(ApiKey key, string rawKey)> CreateApiKeyAsync(string name, Guid orgId, CancellationToken ct = default);
    Task<bool> RevokeApiKeyAsync(Guid keyId, Guid orgId, CancellationToken ct = default);
}
