using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Services;

public class ConfigurationService : IConfigurationService
{
    private readonly AppDbContext _db;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ITokenService _tokenService;

    public ConfigurationService(AppDbContext db, IHttpClientFactory httpClientFactory, ITokenService tokenService)
    {
        _db = db;
        _httpClientFactory = httpClientFactory;
        _tokenService = tokenService;
    }

    // ── Pipeline Sources ──────────────────────────────────────────────

    public async Task<List<PipelineSource>> GetAllSourcesAsync(Guid orgId, CancellationToken ct = default)
    {
        return await _db.PipelineSources
            .Include(s => s.Repositories)
            .Where(s => s.OrganizationId == orgId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<PipelineSource?> GetSourceByIdAsync(int id, Guid orgId, CancellationToken ct = default)
    {
        return await _db.PipelineSources
            .Include(s => s.Repositories)
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == orgId, ct);
    }

    public async Task<PipelineSource> CreateSourceAsync(PipelineSource source, Guid orgId, CancellationToken ct = default)
    {
        source.OrganizationId = orgId;
        source.CreatedAt = DateTime.UtcNow;
        source.UpdatedAt = DateTime.UtcNow;
        _db.PipelineSources.Add(source);
        await _db.SaveChangesAsync(ct);
        return source;
    }

    public async Task<PipelineSource?> UpdateSourceAsync(int id, PipelineSource updated, Guid orgId, CancellationToken ct = default)
    {
        var source = await _db.PipelineSources
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == orgId, ct);
        if (source is null) return null;

        source.Name = updated.Name;
        source.Provider = updated.Provider;
        source.BaseUrl = updated.BaseUrl;
        if (!string.IsNullOrEmpty(updated.AccessToken))
            source.AccessToken = updated.AccessToken;
        source.IsActive = updated.IsActive;
        source.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
        return await GetSourceByIdAsync(id, orgId, ct);
    }

    public async Task<bool> DeleteSourceAsync(int id, Guid orgId, CancellationToken ct = default)
    {
        var source = await _db.PipelineSources
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == orgId, ct);
        if (source is null) return false;

        _db.PipelineSources.Remove(source);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> TestSourceConnectionAsync(int id, Guid orgId, CancellationToken ct = default)
    {
        var source = await _db.PipelineSources
            .FirstOrDefaultAsync(s => s.Id == id && s.OrganizationId == orgId, ct);
        if (source is null) return false;

        try
        {
            return source.Provider.ToLower() switch
            {
                "github" => await TestGitHubConnectionAsync(source, ct),
                "azure_devops" => await TestAzureDevOpsConnectionAsync(source, ct),
                "gitlab" => await TestGitLabConnectionAsync(source, ct),
                _ => false
            };
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> TestGitHubConnectionAsync(PipelineSource source, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient("GitHub");
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", source.AccessToken);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("FixMyBuild-AI");

        var response = await client.GetAsync("user", ct);
        return response.IsSuccessStatusCode;
    }

    private async Task<bool> TestAzureDevOpsConnectionAsync(PipelineSource source, CancellationToken ct)
    {
        var baseUrl = source.BaseUrl?.TrimEnd('/') ?? "https://dev.azure.com";
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Basic",
                Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes($":{source.AccessToken}")));

        var response = await client.GetAsync($"{baseUrl}/_apis/projects?api-version=7.0", ct);
        return response.IsSuccessStatusCode;
    }

    private async Task<bool> TestGitLabConnectionAsync(PipelineSource source, CancellationToken ct)
    {
        var baseUrl = source.BaseUrl?.TrimEnd('/') ?? "https://gitlab.com";
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("PRIVATE-TOKEN", source.AccessToken);

        var response = await client.GetAsync($"{baseUrl}/api/v4/user", ct);
        return response.IsSuccessStatusCode;
    }

    // ── Connected Repositories ────────────────────────────────────────

    public async Task<List<ConnectedRepository>> GetRepositoriesAsync(int sourceId, Guid orgId, CancellationToken ct = default)
    {
        // Verify the source belongs to this org
        var sourceExists = await _db.PipelineSources
            .AnyAsync(s => s.Id == sourceId && s.OrganizationId == orgId, ct);
        if (!sourceExists) return new List<ConnectedRepository>();

        return await _db.ConnectedRepositories
            .Where(r => r.PipelineSourceId == sourceId)
            .OrderBy(r => r.FullName)
            .ToListAsync(ct);
    }

    public async Task<ConnectedRepository> AddRepositoryAsync(int sourceId, ConnectedRepository repo, Guid orgId, CancellationToken ct = default)
    {
        var sourceExists = await _db.PipelineSources
            .AnyAsync(s => s.Id == sourceId && s.OrganizationId == orgId, ct);
        if (!sourceExists)
            throw new UnauthorizedAccessException("Pipeline source not found or access denied.");

        repo.PipelineSourceId = sourceId;
        repo.CreatedAt = DateTime.UtcNow;
        _db.ConnectedRepositories.Add(repo);
        await _db.SaveChangesAsync(ct);
        return repo;
    }

    public async Task<ConnectedRepository?> UpdateRepositoryAsync(int repoId, ConnectedRepository updated, Guid orgId, CancellationToken ct = default)
    {
        var repo = await _db.ConnectedRepositories
            .Include(r => r.PipelineSource)
            .FirstOrDefaultAsync(r => r.Id == repoId, ct);
        if (repo is null || repo.PipelineSource.OrganizationId != orgId) return null;

        repo.FullName = updated.FullName;
        repo.IsActive = updated.IsActive;
        repo.AutoAnalyze = updated.AutoAnalyze;
        repo.AutoCreatePr = updated.AutoCreatePr;

        await _db.SaveChangesAsync(ct);
        return repo;
    }

    public async Task<bool> RemoveRepositoryAsync(int repoId, Guid orgId, CancellationToken ct = default)
    {
        var repo = await _db.ConnectedRepositories
            .Include(r => r.PipelineSource)
            .FirstOrDefaultAsync(r => r.Id == repoId, ct);
        if (repo is null || repo.PipelineSource.OrganizationId != orgId) return false;

        _db.ConnectedRepositories.Remove(repo);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ── API Keys ──────────────────────────────────────────────────────

    public async Task<List<ApiKey>> GetApiKeysAsync(Guid orgId, CancellationToken ct = default)
    {
        return await _db.ApiKeys
            .Where(k => k.OrganizationId == orgId && k.IsActive)
            .OrderByDescending(k => k.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<(ApiKey key, string rawKey)> CreateApiKeyAsync(string name, Guid orgId, CancellationToken ct = default)
    {
        var rawKey = _tokenService.GenerateApiKey(out var keyHash, out var keyPrefix);
        var key = new ApiKey
        {
            OrganizationId = orgId,
            Name = name,
            KeyPrefix = keyPrefix,
            KeyHash = keyHash,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
        _db.ApiKeys.Add(key);
        await _db.SaveChangesAsync(ct);
        return (key, rawKey);
    }

    public async Task<bool> RevokeApiKeyAsync(Guid keyId, Guid orgId, CancellationToken ct = default)
    {
        var key = await _db.ApiKeys
            .FirstOrDefaultAsync(k => k.Id == keyId && k.OrganizationId == orgId, ct);
        if (key is null) return false;
        key.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ── For Background Worker ─────────────────────────────────────────

    public async Task<List<(ConnectedRepository Repo, string Token)>> GetActiveReposWithTokensAsync(CancellationToken ct = default)
    {
        var results = await _db.ConnectedRepositories
            .Include(r => r.PipelineSource)
            .Where(r => r.IsActive && r.AutoAnalyze && r.PipelineSource.IsActive)
            .ToListAsync(ct);

        return results
            .Select(r => (r, r.PipelineSource.AccessToken))
            .ToList();
    }
}
