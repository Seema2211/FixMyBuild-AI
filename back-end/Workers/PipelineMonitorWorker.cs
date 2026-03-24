using FixMyBuildApi.Services;

namespace FixMyBuildApi.Workers;

public class PipelineMonitorWorker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PipelineMonitorWorker> _logger;
    private readonly IConfiguration _configuration;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    public PipelineMonitorWorker(IServiceScopeFactory scopeFactory, ILogger<PipelineMonitorWorker> logger, IConfiguration configuration)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _configuration = configuration;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("PipelineMonitorWorker started. Interval: {Interval} minutes.", Interval.TotalMinutes);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var configService = scope.ServiceProvider.GetRequiredService<IConfigurationService>();
                var pipelineService = scope.ServiceProvider.GetRequiredService<IPipelineService>();

                // First: process repos from Admin Configuration Portal (DB)
                var dbRepos = await configService.GetActiveReposWithTokensAsync(stoppingToken);
                if (dbRepos.Count > 0)
                {
                    _logger.LogInformation("Processing {Count} configured repositories from admin portal.", dbRepos.Count);
                    foreach (var (repo, token) in dbRepos)
                    {
                        if (stoppingToken.IsCancellationRequested) break;
                        var parts = repo.FullName.Split('/', 2, StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length != 2) continue;

                        try
                        {
                            await pipelineService.ProcessFailuresWithTokenAsync(parts[0], parts[1], token, repo.PipelineSource?.OrganizationId, stoppingToken);
                            _logger.LogDebug("Processed failures for {Repo} (source: DB)", repo.FullName);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Error processing {Repo} from admin config", repo.FullName);
                        }
                    }
                }

                // Fallback: process repos from appsettings.json (legacy support)
                var configRepos = _configuration.GetSection("GitHub:Repos").Get<string[]>();
                if (configRepos is { Length: > 0 })
                {
                    foreach (var repoStr in configRepos)
                    {
                        if (stoppingToken.IsCancellationRequested) break;
                        var parts = repoStr.Split('/', 2, StringSplitOptions.RemoveEmptyEntries);
                        if (parts.Length != 2) continue;

                        // Skip if already processed from DB config
                        if (dbRepos.Any(r => r.Repo.FullName.Equals(repoStr, StringComparison.OrdinalIgnoreCase)))
                            continue;

                        try
                        {
                            await pipelineService.ProcessFailuresAsync(parts[0], parts[1], stoppingToken);
                            _logger.LogDebug("Processed failures for {Owner}/{Repo} (source: config)", parts[0], parts[1]);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Error processing {Owner}/{Repo}", parts[0], parts[1]);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PipelineMonitorWorker iteration failed.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }
}
