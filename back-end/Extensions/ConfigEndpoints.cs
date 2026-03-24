using System.Security.Claims;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services;
using ClaimTypes = System.Security.Claims.ClaimTypes;

namespace FixMyBuildApi.Extensions;

public static class ConfigEndpoints
{
    public static void MapConfigEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/config").RequireAuthorization();

        // ── Pipeline Sources ──────────────────────────────────────────

        group.MapGet("/sources", async (ClaimsPrincipal user, IConfigurationService configService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var sources = await configService.GetAllSourcesAsync(orgId.Value, ct);
            var result = sources.Select(s => new
            {
                s.Id,
                s.Name,
                s.Provider,
                s.BaseUrl,
                s.IsActive,
                s.CreatedAt,
                s.UpdatedAt,
                TokenConfigured = !string.IsNullOrEmpty(s.AccessToken),
                MaskedToken = MaskToken(s.AccessToken),
                Repositories = s.Repositories.Select(r => new
                {
                    r.Id,
                    r.FullName,
                    r.IsActive,
                    r.AutoAnalyze,
                    r.AutoCreatePr,
                    r.LastSyncedAt,
                    r.CreatedAt
                })
            });
            return Results.Ok(result);
        });

        group.MapGet("/sources/{id:int}", async (int id, ClaimsPrincipal user, IConfigurationService configService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var source = await configService.GetSourceByIdAsync(id, orgId.Value, ct);
            if (source is null) return Results.NotFound();
            return Results.Ok(new
            {
                source.Id,
                source.Name,
                source.Provider,
                source.BaseUrl,
                source.IsActive,
                source.CreatedAt,
                source.UpdatedAt,
                TokenConfigured = !string.IsNullOrEmpty(source.AccessToken),
                MaskedToken = MaskToken(source.AccessToken),
                Repositories = source.Repositories.Select(r => new
                {
                    r.Id,
                    r.FullName,
                    r.IsActive,
                    r.AutoAnalyze,
                    r.AutoCreatePr,
                    r.LastSyncedAt,
                    r.CreatedAt
                })
            });
        });

        group.MapPost("/sources", async (CreateSourceRequest request, ClaimsPrincipal user, IConfigurationService configService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.BadRequest("Name is required.");
            if (string.IsNullOrWhiteSpace(request.AccessToken))
                return Results.BadRequest("Access token is required.");

            var source = new PipelineSource
            {
                Name = request.Name.Trim(),
                Provider = request.Provider?.Trim().ToLower() ?? "github",
                BaseUrl = request.BaseUrl?.Trim(),
                AccessToken = request.AccessToken.Trim(),
                IsActive = request.IsActive ?? true
            };

            var created = await configService.CreateSourceAsync(source, orgId.Value, ct);
            return Results.Created($"/api/config/sources/{created.Id}", new
            {
                created.Id,
                created.Name,
                created.Provider,
                created.BaseUrl,
                created.IsActive,
                created.CreatedAt,
                TokenConfigured = true,
                MaskedToken = MaskToken(created.AccessToken)
            });
        });

        group.MapPut("/sources/{id:int}", async (int id, UpdateSourceRequest request, ClaimsPrincipal user, IConfigurationService configService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var updated = new PipelineSource
            {
                Name = request.Name?.Trim() ?? "",
                Provider = request.Provider?.Trim().ToLower() ?? "github",
                BaseUrl = request.BaseUrl?.Trim(),
                AccessToken = request.AccessToken?.Trim() ?? "",
                IsActive = request.IsActive ?? true
            };

            var result = await configService.UpdateSourceAsync(id, updated, orgId.Value, ct);
            return result is null ? Results.NotFound() : Results.Ok(new
            {
                result.Id,
                result.Name,
                result.Provider,
                result.BaseUrl,
                result.IsActive,
                result.CreatedAt,
                result.UpdatedAt,
                TokenConfigured = !string.IsNullOrEmpty(result.AccessToken),
                MaskedToken = MaskToken(result.AccessToken),
                Repositories = result.Repositories.Select(r => new
                {
                    r.Id,
                    r.FullName,
                    r.IsActive,
                    r.AutoAnalyze,
                    r.AutoCreatePr,
                    r.LastSyncedAt,
                    r.CreatedAt
                })
            });
        });

        group.MapDelete("/sources/{id:int}", async (int id, ClaimsPrincipal user, IConfigurationService configService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var deleted = await configService.DeleteSourceAsync(id, orgId.Value, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        group.MapPost("/sources/{id:int}/test", async (int id, ClaimsPrincipal user, IConfigurationService configService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var success = await configService.TestSourceConnectionAsync(id, orgId.Value, ct);
            return Results.Ok(new { connected = success });
        });

        // ── Connected Repositories ────────────────────────────────────

        group.MapGet("/sources/{sourceId:int}/repos", async (int sourceId, ClaimsPrincipal user, IConfigurationService configService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var repos = await configService.GetRepositoriesAsync(sourceId, orgId.Value, ct);
            return Results.Ok(repos.Select(r => new
            {
                r.Id,
                r.PipelineSourceId,
                r.FullName,
                r.IsActive,
                r.AutoAnalyze,
                r.AutoCreatePr,
                r.LastSyncedAt,
                r.CreatedAt
            }));
        });

        group.MapPost("/sources/{sourceId:int}/repos", async (int sourceId, AddRepoRequest request, ClaimsPrincipal user, IConfigurationService configService, ISubscriptionService subscriptionService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(request.FullName))
                return Results.BadRequest("Repository full name (owner/repo) is required.");

            try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.Repos); }
            catch (PlanLimitException ex)
            {
                return Results.Json(new { error = "plan_limit", limit = ex.LimitName, plan = ex.CurrentPlan.ToString().ToLower(), upgradeUrl = "/pricing" }, statusCode: 402);
            }

            var repo = new ConnectedRepository
            {
                FullName = request.FullName.Trim(),
                IsActive = request.IsActive ?? true,
                AutoAnalyze = request.AutoAnalyze ?? true,
                AutoCreatePr = request.AutoCreatePr ?? true
            };

            try
            {
                var created = await configService.AddRepositoryAsync(sourceId, repo, orgId.Value, ct);
                return Results.Created($"/api/config/sources/{sourceId}/repos", new
                {
                    created.Id,
                    created.PipelineSourceId,
                    created.FullName,
                    created.IsActive,
                    created.AutoAnalyze,
                    created.AutoCreatePr,
                    created.CreatedAt
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Results.NotFound();
            }
        });

        group.MapPut("/repos/{repoId:int}", async (int repoId, UpdateRepoRequest request, ClaimsPrincipal user, IConfigurationService configService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var updated = new ConnectedRepository
            {
                FullName = request.FullName?.Trim() ?? "",
                IsActive = request.IsActive ?? true,
                AutoAnalyze = request.AutoAnalyze ?? true,
                AutoCreatePr = request.AutoCreatePr ?? true
            };

            var result = await configService.UpdateRepositoryAsync(repoId, updated, orgId.Value, ct);
            return result is null ? Results.NotFound() : Results.Ok(new
            {
                result.Id,
                result.PipelineSourceId,
                result.FullName,
                result.IsActive,
                result.AutoAnalyze,
                result.AutoCreatePr,
                result.LastSyncedAt,
                result.CreatedAt
            });
        });

        group.MapDelete("/repos/{repoId:int}", async (int repoId, ClaimsPrincipal user, IConfigurationService configService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var deleted = await configService.RemoveRepositoryAsync(repoId, orgId.Value, ct);
            return deleted ? Results.NoContent() : Results.NotFound();
        });

        // ── Notification Settings ───────────────────────────────────

        group.MapGet("/notifications", async (ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var settings = await notifService.GetSettingsAsync(orgId.Value, ct);
            return Results.Ok(new
            {
                settings.Id,
                settings.SlackWebhookUrl,
                settings.SlackEnabled,
                settings.SmtpHost,
                settings.SmtpPort,
                settings.SmtpUsername,
                SmtpPassword = string.IsNullOrEmpty(settings.SmtpPassword) ? "" : "********",
                settings.SmtpFromEmail,
                settings.SmtpUseSsl,
                settings.EmailEnabled,
                settings.NotifyPrAuthor,
                settings.AdditionalRecipients,
                settings.NotifyOnHigh,
                settings.NotifyOnMedium,
                settings.NotifyOnLow,
                settings.UpdatedAt
            });
        });

        group.MapPut("/notifications", async (NotificationSetting request, ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var updated = await notifService.UpdateSettingsAsync(request, orgId.Value, ct);
            return Results.Ok(updated);
        });

        group.MapPost("/notifications/test-slack", async (ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var success = await notifService.TestSlackAsync(orgId.Value, ct);
            return Results.Ok(new { success });
        });

        group.MapPost("/notifications/test-email", async (TestEmailRequest request, ClaimsPrincipal user, INotificationService notifService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(request.Recipient))
                return Results.BadRequest("Recipient email is required.");
            var success = await notifService.TestEmailAsync(request.Recipient.Trim(), orgId.Value, ct);
            return Results.Ok(new { success });
        });

        // ── API Keys ──────────────────────────────────────────────────

        group.MapGet("/api-keys", async (ClaimsPrincipal user, IConfigurationService configService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var keys = await configService.GetApiKeysAsync(orgId.Value, ct);
            return Results.Ok(keys.Select(k => new
            {
                k.Id,
                k.Name,
                k.KeyPrefix,
                k.LastUsedAt,
                k.CreatedAt,
            }));
        });

        group.MapPost("/api-keys", async (CreateApiKeyRequest request, ClaimsPrincipal user, IConfigurationService configService, IAuditService auditService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            if (string.IsNullOrWhiteSpace(request.Name))
                return Results.BadRequest("Name is required.");

            var (key, rawKey) = await configService.CreateApiKeyAsync(request.Name.Trim(), orgId.Value, ct);
            var actorEmail = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");
            await auditService.LogAsync(AuditActions.ApiKeyCreated, orgId.Value, user.GetUserId(), actorEmail, details: request.Name.Trim(), ct: ct);
            return Results.Created($"/api/config/api-keys/{key.Id}", new
            {
                key.Id,
                key.Name,
                key.KeyPrefix,
                key.CreatedAt,
                RawKey = rawKey,   // returned once — never stored in plaintext
            });
        });

        group.MapDelete("/api-keys/{keyId:guid}", async (Guid keyId, ClaimsPrincipal user, IConfigurationService configService, IAuditService auditService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var revoked = await configService.RevokeApiKeyAsync(keyId, orgId.Value, ct);
            if (revoked)
            {
                var actorEmail = user.FindFirstValue(ClaimTypes.Email) ?? user.FindFirstValue("email");
                await auditService.LogAsync(AuditActions.ApiKeyRevoked, orgId.Value, user.GetUserId(), actorEmail, details: keyId.ToString(), ct: ct);
            }
            return revoked ? Results.NoContent() : Results.NotFound();
        });
    }

    private static string MaskToken(string? token)
    {
        if (string.IsNullOrEmpty(token) || token.Length < 8) return "****";
        return token[..4] + new string('*', Math.Min(token.Length - 8, 20)) + token[^4..];
    }

    // ── Request DTOs ──────────────────────────────────────────────────

    private class CreateSourceRequest
    {
        public string Name { get; set; } = "";
        public string? Provider { get; set; }
        public string? BaseUrl { get; set; }
        public string AccessToken { get; set; } = "";
        public bool? IsActive { get; set; }
    }

    private class UpdateSourceRequest
    {
        public string? Name { get; set; }
        public string? Provider { get; set; }
        public string? BaseUrl { get; set; }
        public string? AccessToken { get; set; }
        public bool? IsActive { get; set; }
    }

    private class AddRepoRequest
    {
        public string FullName { get; set; } = "";
        public bool? IsActive { get; set; }
        public bool? AutoAnalyze { get; set; }
        public bool? AutoCreatePr { get; set; }
    }

    private class UpdateRepoRequest
    {
        public string? FullName { get; set; }
        public bool? IsActive { get; set; }
        public bool? AutoAnalyze { get; set; }
        public bool? AutoCreatePr { get; set; }
    }

    private class TestEmailRequest
    {
        public string Recipient { get; set; } = "";
    }

    private class CreateApiKeyRequest
    {
        public string Name { get; set; } = "";
    }
}
