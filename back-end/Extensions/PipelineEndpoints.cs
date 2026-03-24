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

            try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.Analytics); }
            catch (PlanLimitException ex)
            {
                return Results.Json(new { error = "plan_limit", limit = ex.LimitName, plan = ex.CurrentPlan.ToString().ToLower(), upgradeUrl = "/pricing" }, statusCode: 402);
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

            try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.AiAnalysis); }
            catch (PlanLimitException ex)
            {
                return Results.Json(new { error = "plan_limit", limit = ex.LimitName, plan = ex.CurrentPlan.ToString().ToLower(), upgradeUrl = "/pricing" }, statusCode: 402);
            }

            if (string.IsNullOrWhiteSpace(request.Owner) || string.IsNullOrWhiteSpace(request.Repo))
                return Results.BadRequest("Owner and Repo are required.");

            var failure = await pipelineService.AnalyzeSingleRunAsync(request.Owner, request.Repo, request.RunId, orgId, ct);
            if (failure is not null)
                try { await subscriptionService.IncrementAiAnalysisUsageAsync(orgId.Value); } catch { }

            return failure is null ? Results.NotFound() : Results.Ok(failure);
        });

        // POST /api/pipelines/create-pr
        group.MapPost("/create-pr", async (PullRequestRequest request, ClaimsPrincipal user, IPipelineService pipelineService, IGitHubService githubService, ISubscriptionService subscriptionService, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.AutoPr); }
            catch (PlanLimitException ex)
            {
                return Results.Json(new { error = "plan_limit", limit = ex.LimitName, plan = ex.CurrentPlan.ToString().ToLower(), upgradeUrl = "/pricing" }, statusCode: 402);
            }

            var failure = await pipelineService.GetFailureByIdAsync(request.PipelineFailureId, orgId, ct);
            if (failure is null)
                return Results.NotFound("Pipeline failure not found.");

            var owner = request.RepoOwner ?? failure.RepoOwner ?? "";
            var repo = request.RepoName ?? failure.RepoName ?? "";
            if (string.IsNullOrEmpty(owner) || string.IsNullOrEmpty(repo))
                return Results.BadRequest("Repo owner and name are required.");

            var branchName = request.BranchName ?? $"fixmybuild/fix-{failure.RunId ?? 0}";
            var fixContent = $"# Fix suggestion\n\n{failure.FixSuggestion}";
            if (failure.KeyErrorLines?.Count > 0)
                fixContent += "\n\n## Key error lines\n```\n" + string.Join("\n", failure.KeyErrorLines) + "\n```";

            var pr = await githubService.CreatePullRequestAsync(owner, repo, branchName, fixContent,
                $"Fix: {failure.RootCause}",
                $"Fix: {failure.RootCause}",
                $"AI-suggested fix for pipeline failure (confidence: {failure.Confidence}%).\n\n{failure.ErrorSummary ?? failure.Explanation}",
                ct);

            if (pr is null)
                return Results.Problem("Failed to create pull request.");

            var updated = await pipelineService.UpdatePullRequestAsync(failure.Id, pr, ct);
            return Results.Ok(pr);
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
