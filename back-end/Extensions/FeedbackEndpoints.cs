using System.Security.Claims;
using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using FixMyBuildApi.Services;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Extensions;

public static class FeedbackEndpoints
{
    public static void MapFeedbackEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/failures").RequireAuthorization();

        // ── GET /api/failures/{id}/feedback ─────────────────────────────
        // Returns the feedback record for a specific failure (all plans).
        group.MapGet("/{id}/feedback", async (
            string id,
            ClaimsPrincipal principal,
            IFeedbackService feedbackService,
            CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            var feedback = await feedbackService.GetForFailureAsync(orgId.Value, id, ct);
            if (feedback is null) return Results.NotFound();

            return Results.Ok(new
            {
                feedback.Id,
                feedback.Outcome,
                feedback.OutcomeSource,
                feedback.OutcomeRecordedAt,
                feedback.OriginalConfidence,
                feedback.ErrorFingerprint,
                feedback.Category,
                HasPr = feedback.PrNumber.HasValue,
                feedback.PrNumber,
                feedback.PrUrl,
                feedback.CreatedAt,
            });
        });

        // ── POST /api/failures/{id}/feedback ─────────────────────────────
        // Manual feedback from the UI (Accept / Reject / Modified).
        group.MapPost("/{id}/feedback", async (
            string id,
            ManualFeedbackRequest req,
            ClaimsPrincipal principal,
            IFeedbackService feedbackService,
            CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            if (req.Outcome == FeedbackOutcome.Pending)
                return Results.BadRequest(new { message = "Outcome must be Accepted, Rejected, or Modified." });

            if (req.Outcome == FeedbackOutcome.Modified && string.IsNullOrWhiteSpace(req.ActualFix))
                return Results.BadRequest(new { message = "ActualFix is required when outcome is Modified." });

            await feedbackService.RecordManualOutcomeAsync(orgId.Value, id, req.Outcome, req.ActualFix, ct);
            return Results.Ok(new { message = "Feedback recorded." });
        });

        // ── GET /api/patterns ─────────────────────────────────────────────
        // Pattern analytics — Pro+ only. Enforced at service layer via Analytics limit.
        var patternsGroup = app.MapGroup("/api/patterns").RequireAuthorization();

        patternsGroup.MapGet("/", async (
            ClaimsPrincipal principal,
            IFeedbackService feedbackService,
            ISubscriptionService subscriptionService,
            int page = 1, int pageSize = 20,
            CancellationToken ct = default) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            // Plan gate: Analytics is Pro+ only
            if (!principal.IsSuperAdmin())
            {
                try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.Analytics); }
                catch (PlanLimitException ex) { return ApiErrors.PlanLimit(ex); }
            }

            var (total, items) = await feedbackService.GetPatternsAsync(orgId.Value, page, pageSize, ct);

            return Results.Ok(new
            {
                total,
                page,
                pageSize,
                items = items.Select(p => new
                {
                    p.Id,
                    p.Category,
                    p.ErrorFingerprint,
                    p.OccurrenceCount,
                    p.AcceptedCount,
                    p.RejectedCount,
                    p.ModifiedCount,
                    AcceptanceRatePct = Math.Round(p.AcceptanceRate * 100, 1),
                    HasSuccessfulFix  = !string.IsNullOrWhiteSpace(p.LastSuccessfulFix),
                    p.FirstSeenAt,
                    p.LastSeenAt,
                }),
            });
        });

        // ── GET /api/patterns/{fingerprint} ──────────────────────────────
        // Single pattern detail — Pro+ only.
        patternsGroup.MapGet("/{fingerprint}", async (
            string fingerprint,
            ClaimsPrincipal principal,
            IFeedbackService feedbackService,
            ISubscriptionService subscriptionService,
            CancellationToken ct) =>
        {
            var orgId = principal.GetOrgId();
            if (orgId is null) return Results.Unauthorized();

            if (!principal.IsSuperAdmin())
            {
                try { await subscriptionService.EnforceLimitAsync(orgId.Value, LimitType.Analytics); }
                catch (PlanLimitException ex) { return ApiErrors.PlanLimit(ex); }
            }

            var p = await feedbackService.GetPatternByFingerprintAsync(orgId.Value, fingerprint, ct);
            if (p is null) return Results.NotFound();

            return Results.Ok(new
            {
                p.Id,
                p.Category,
                p.ErrorFingerprint,
                p.OccurrenceCount,
                p.AcceptedCount,
                p.RejectedCount,
                p.ModifiedCount,
                AcceptanceRatePct = Math.Round(p.AcceptanceRate * 100, 1),
                HasSuccessfulFix  = !string.IsNullOrWhiteSpace(p.LastSuccessfulFix),
                p.FirstSeenAt,
                p.LastSeenAt,
            });
        });

        // ── POST /api/ingest/vcs/pr-event ────────────────────────────────
        // Receives VCS webhook events for PR merge/close (auto feedback capture).
        // Map under /api/ingest so it sits alongside the existing ingest endpoint.
        app.MapPost("/api/ingest/vcs/pr-event", async (
            VcsPrEventRequest req,
            IFeedbackService feedbackService,
            AppDbContext db,
            CancellationToken ct) =>
        {
            // Look up org by repo coordinates (find source that monitors this repo)
            var orgId = await db.PipelineSources
                .Where(s => s.IsActive)
                .Join(db.ConnectedRepositories,
                    s => s.Id, r => r.PipelineSourceId,
                    (s, r) => new { s.OrganizationId, r.FullName })
                .Where(x => x.FullName == $"{req.RepoOwner}/{req.RepoName}")
                .Select(x => x.OrganizationId)
                .FirstOrDefaultAsync(ct);

            if (orgId == null) return Results.NotFound();

            var outcome = req.Merged ? FeedbackOutcome.Accepted : FeedbackOutcome.Rejected;

            await feedbackService.RecordVcsOutcomeAsync(
                orgId.Value, req.PrNumber, req.RepoOwner, req.RepoName,
                outcome, ct: ct);

            return Results.Ok();
        });
    }

    private record ManualFeedbackRequest(FeedbackOutcome Outcome, string? ActualFix);

    private record VcsPrEventRequest(
        int    PrNumber,
        string RepoOwner,
        string RepoName,
        bool   Merged);
}
