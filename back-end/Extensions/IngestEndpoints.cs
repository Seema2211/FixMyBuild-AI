using FixMyBuildApi.Constants;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Extensions;

public static class IngestEndpoints
{
    public static void MapIngestEndpoints(this IEndpointRouteBuilder app)
    {
        // POST /api/ingest — authenticated by API key (Authorization: Bearer fmb_live_...)
        app.MapPost("/api/ingest", async (
            HttpRequest request,
            AppDbContext db,
            IAIAnalyzerService aiAnalyzer,
            INotificationService notifService,
            ITokenService tokenService,
            ISubscriptionService subscriptionService,
            ISseService sseService,
            IWebhookDeliveryService webhookDelivery,
            IServiceScopeFactory scopeFactory,
            IAutoFixService autoFixService,
            CancellationToken ct) =>
        {
            // ── 1. Validate API key ─────────────────────────────────
            var authHeader = request.Headers.Authorization.ToString();
            if (!authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return Results.Unauthorized();

            var rawKey = authHeader["Bearer ".Length..].Trim();
            if (string.IsNullOrEmpty(rawKey))
                return Results.Unauthorized();

            var keyHash = tokenService.HashToken(rawKey);
            var apiKey = await db.ApiKeys
                .FirstOrDefaultAsync(k => k.KeyHash == keyHash && k.IsActive, ct);

            if (apiKey is null)
                return Results.Unauthorized();

            // ── 2. Update last-used timestamp ───────────────────────
            apiKey.LastUsedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);

            // ── 3. Parse payload ────────────────────────────────────
            IngestRequest? payload;
            try
            {
                payload = await request.ReadFromJsonAsync<IngestRequest>(ct);
            }
            catch
            {
                return Results.BadRequest("Invalid JSON payload.");
            }

            if (payload is null || string.IsNullOrWhiteSpace(payload.ErrorLog))
                return Results.BadRequest("errorLog is required.");

            // ── 3b. Enforce failure/month limit ─────────────────────
            try { await subscriptionService.EnforceLimitAsync(apiKey.OrganizationId, LimitType.FailuresPerMonth); }
            catch (PlanLimitException ex)
            {
                return ApiErrors.PlanLimit(ex);
            }

            // ── 4. Dedup: skip if already processed ─────────────────
            var id = payload.RunId.HasValue
                ? $"ingest:{payload.RepoOwner}:{payload.RepoName}:{payload.RunId}"
                : $"ingest:{apiKey.OrganizationId:N}:{Guid.NewGuid():N}";

            if (payload.RunId.HasValue &&
                await db.PipelineFailures.AnyAsync(f => f.Id == id, ct))
                return Results.Ok(new { id, status = FailureStatus.AlreadyProcessed });

            // ── 5. AI analysis (best-effort, plan-gated) ────────────
            AIAnalysis? analysis = null;
            try
            {
                await subscriptionService.EnforceLimitAsync(apiKey.OrganizationId, LimitType.AiAnalysis);
                analysis = await aiAnalyzer.AnalyzeLogsAsync(payload.ErrorLog, apiKey.OrganizationId, ct);
                await subscriptionService.IncrementAiAnalysisUsageAsync(apiKey.OrganizationId);
            }
            catch (PlanLimitException) { /* AI limit reached — store raw log without analysis */ }
            catch { /* AI unavailable — store raw log without analysis */ }

            // ── 6. Persist failure ──────────────────────────────────
            var failure = new PipelineFailure
            {
                Id = id,
                OrganizationId = apiKey.OrganizationId,
                PipelineName = payload.PipelineName?.Trim() ?? "Pipeline",
                Status = FailureStatus.Failure,
                ErrorLog = payload.ErrorLog,
                FailedStage = analysis?.FailedStage,
                ErrorSummary = analysis?.ErrorSummary,
                RootCause = analysis?.RootCause ?? "Unknown",
                Category = analysis?.Category,
                FixSuggestion = analysis?.FixSuggestion ?? "",
                KeyErrorLines = analysis?.KeyErrorLines ?? new(),
                Severity = analysis?.Severity,
                Confidence = analysis?.Confidence ?? 0,
                Explanation = "",
                Command = payload.Provider ?? "push",
                CreatedAt = DateTime.UtcNow,
                RepoOwner = payload.RepoOwner,
                RepoName = payload.RepoName,
                RunId = payload.RunId,
                HeadBranch = payload.Branch,
                ActorLogin = payload.ActorLogin,
                CommitAuthorEmail = payload.CommitAuthorEmail,
                CommitAuthorName = payload.CommitAuthorName,
            };

            db.PipelineFailures.Add(failure);
            await db.SaveChangesAsync(ct);

            // ── 6b. Increment usage counter ──────────────────────────
            try { await subscriptionService.IncrementFailureUsageAsync(apiKey.OrganizationId); } catch { }

            // ── 7. Notification (best-effort) ───────────────────────
            try
            {
                await notifService.NotifyFailureAsync(failure, ct);
                failure.NotificationSent = true;
                await db.SaveChangesAsync(ct);
            }
            catch { }

            // ── 8. SSE real-time push (singleton, fire-and-forget) ──
            try
            {
                await sseService.PublishAsync(apiKey.OrganizationId, "failure.created", new
                {
                    id = failure.Id,
                    pipelineName = failure.PipelineName,
                    repoOwner = failure.RepoOwner,
                    repoName = failure.RepoName,
                    severity = failure.Severity,
                    rootCause = failure.RootCause,
                    category = failure.Category,
                    createdAt = failure.CreatedAt,
                });
            }
            catch { }

            // ── 9. In-app notification + bell SSE update ─────────────
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = scopeFactory.CreateScope();
                    var scopedDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                    var scopedSse = scope.ServiceProvider.GetRequiredService<ISseService>();
                    var repo = string.IsNullOrEmpty(failure.RepoName)
                        ? failure.PipelineName
                        : $"{failure.RepoOwner}/{failure.RepoName}";
                    await NotificationEndpoints.CreateAndPublishAsync(
                        scopedDb, scopedSse,
                        failure.OrganizationId ?? apiKey.OrganizationId, userId: null,
                        title: "Pipeline failure detected",
                        message: $"{repo} failed — {failure.RootCause}",
                        type: failure.Severity?.ToLower() == "critical" ? "error" : "warning",
                        link: $"/dashboard?highlight={Uri.EscapeDataString(failure.Id)}");
                }
                catch { }
            });

            // ── 10. Outbound webhooks (already fire-and-forget inside service) ─
            try
            {
                await webhookDelivery.DeliverAsync(apiKey.OrganizationId, "failure.created", new
                {
                    id = failure.Id,
                    pipelineName = failure.PipelineName,
                    repoOwner = failure.RepoOwner,
                    repoName = failure.RepoName,
                    branch = failure.HeadBranch,
                    severity = failure.Severity,
                    rootCause = failure.RootCause,
                    category = failure.Category,
                    fixSuggestion = failure.FixSuggestion,
                    createdAt = failure.CreatedAt,
                });
            }
            catch { }

            // ── 11. Auto-fix: AI comment on open PRs + create fix PR ───────
            // Plan limit + provider lookup are handled inside AutoFixService.
            CreatedPullRequest? autoPr = null;
            try
            {
                var autoFix = await autoFixService.RunAsync(failure, analysis, apiKey.OrganizationId, ct: ct);
                autoPr = autoFix.PullRequest;
                if (autoPr != null || autoFix.CommentPosted)
                    await db.SaveChangesAsync(ct);
            }
            catch { /* VCS error — non-blocking */ }

            return Results.Created($"/api/pipelines/{Uri.EscapeDataString(id)}", new
            {
                id,
                status = FailureStatus.Processed,
                severity = failure.Severity,
                rootCause = failure.RootCause,
                confidence = failure.Confidence,
                pullRequest = autoPr == null ? null : new { autoPr.PrNumber, autoPr.HtmlUrl, autoPr.BranchName },
            });
        });
    }

    // ── Request DTO ───────────────────────────────────────────────────

    private class IngestRequest
    {
        public string? PipelineName { get; set; }
        public string ErrorLog { get; set; } = "";
        public string? RepoOwner { get; set; }
        public string? RepoName { get; set; }
        public string? Branch { get; set; }
        public long? RunId { get; set; }
        public string? Provider { get; set; }           // "github" | "gitlab" | "azure_devops"
        public string? ActorLogin { get; set; }
        public string? CommitAuthorEmail { get; set; }
        public string? CommitAuthorName { get; set; }
    }
}
