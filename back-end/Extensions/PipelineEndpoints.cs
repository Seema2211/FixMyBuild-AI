using System.Security.Claims;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services;

namespace FixMyBuildApi.Extensions;

public static class PipelineEndpoints
{
    public static void MapPipelineEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/pipelines").RequireAuthorization();

        // GET /api/pipelines?search=&severity=&page=1&pageSize=20
        group.MapGet("/", async (
            string? search,
            string? severity,
            int page,
            int pageSize,
            ClaimsPrincipal user,
            IPipelineService pipelineService,
            ISubscriptionService subscriptionService,
            CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var historyDays = await subscriptionService.GetFailureHistoryDaysAsync(orgId.Value);
            var result = await pipelineService.GetAllFailuresAsync(
                search, severity, page <= 0 ? 1 : page, pageSize <= 0 ? 20 : pageSize, orgId, ct, historyDays);
            return Results.Ok(result);
        });

        // GET /api/pipelines/stats
        group.MapGet("/stats", async (ClaimsPrincipal user, IPipelineService pipelineService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var stats = await pipelineService.GetStatsAsync(orgId, ct);
            return Results.Ok(stats);
        });

        // GET /api/pipelines/analytics
        group.MapGet("/analytics", async (ClaimsPrincipal user, IPipelineService pipelineService, ISubscriptionService subscriptionService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            if (!user.IsSuperAdmin())
            {
                try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.Analytics); }
                catch (PlanLimitException ex)
                {
                    return ApiErrors.PlanLimit(ex);
                }
            }

            var analytics = await pipelineService.GetAnalyticsAsync(orgId, ct);
            return Results.Ok(analytics);
        });

        // GET /api/pipelines/{id}
        group.MapGet("/{id}", async (string id, ClaimsPrincipal user, IPipelineService pipelineService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var failure = await pipelineService.GetFailureByIdAsync(id, orgId, ct);
            return failure is null ? Results.NotFound() : Results.Ok(failure);
        });

        // POST /api/pipelines/analyze
        group.MapPost("/analyze", async (AnalyzeRequest request, ClaimsPrincipal user, IPipelineService pipelineService, ISubscriptionService subscriptionService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            if (!user.IsSuperAdmin())
            {
                try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.AiAnalysis); }
                catch (PlanLimitException ex)
                {
                    return ApiErrors.PlanLimit(ex);
                }
            }

            if (string.IsNullOrWhiteSpace(request.Owner) || string.IsNullOrWhiteSpace(request.Repo))
                return Results.BadRequest("Owner and Repo are required.");

            var failure = await pipelineService.AnalyzeSingleRunAsync(request.Owner, request.Repo, request.RunId, orgId, ct);
            if (failure is not null)
                try { await subscriptionService.IncrementAiAnalysisUsageAsync(orgId.Value); } catch { }

            return failure is null ? Results.NotFound() : Results.Ok(failure);
        });

        // POST /api/pipelines/create-pr
        group.MapPost("/create-pr", async (PullRequestRequest request, ClaimsPrincipal user,
            IPipelineService pipelineService, IAutoFixService autoFixService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var failure = await pipelineService.GetFailureByIdAsync(request.PipelineFailureId, orgId, ct);
            if (failure is null)
                return Results.NotFound("Pipeline failure not found.");

            // Allow caller to override repo coordinates (UI passes them explicitly)
            if (!string.IsNullOrWhiteSpace(request.RepoOwner)) failure.RepoOwner = request.RepoOwner;
            if (!string.IsNullOrWhiteSpace(request.RepoName))  failure.RepoName  = request.RepoName;

            if (string.IsNullOrEmpty(failure.RepoOwner) || string.IsNullOrEmpty(failure.RepoName))
                return Results.BadRequest("Repo owner and name are required.");

            // forceCreate = true bypasses the confidence threshold for manual triggers
            var result = await autoFixService.RunAsync(failure, null, orgId.Value, forceCreate: true, ct: ct);

            if (result.PullRequest == null)
                return Results.Problem(result.SkippedReason ?? "Failed to create pull request.");

            await pipelineService.UpdatePullRequestAsync(failure.Id, result.PullRequest, ct);
            return Results.Ok(result.PullRequest);
        });

        // POST /api/demo/seed — seeds demo data for the authenticated org
        app.MapPost("/api/demo/seed", async (ClaimsPrincipal user, IPipelineService pipelineService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            await pipelineService.SeedDemoDataAsync(orgId, ct);
            return Results.Ok(new { message = "Demo data seeded successfully." });
        }).RequireAuthorization();
    }

    private class AnalyzeRequest
    {
        public string Owner { get; set; } = "";
        public string Repo { get; set; } = "";
        public long RunId { get; set; }
    }
}
