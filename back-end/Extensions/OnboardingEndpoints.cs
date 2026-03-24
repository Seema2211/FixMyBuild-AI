using System.Security.Claims;
using FixMyBuildApi.Data;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Extensions;

public static class OnboardingEndpoints
{
    public static void MapOnboardingEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/onboarding").RequireAuthorization();

        // GET /api/onboarding/status
        group.MapGet("/status", async (ClaimsPrincipal user, AppDbContext db, CancellationToken ct) =>
        {
            var orgId = user.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var hasSource = await db.PipelineSources
                .AnyAsync(s => s.OrganizationId == orgId.Value, ct);

            var hasRepo = await db.ConnectedRepositories
                .AnyAsync(r => r.PipelineSource.OrganizationId == orgId.Value, ct);

            var hasFailure = await db.PipelineFailures
                .AnyAsync(f => f.OrganizationId == orgId.Value, ct);

            return Results.Ok(new
            {
                hasSource,
                hasRepo,
                hasFailure,
                isComplete = hasSource && hasRepo && hasFailure,
            });
        });
    }
}
