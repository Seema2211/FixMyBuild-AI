using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Services;

public class FeedbackService : IFeedbackService
{
    private readonly AppDbContext _db;

    public FeedbackService(AppDbContext db)
    {
        _db = db;
    }

    // ── Create ────────────────────────────────────────────────────

    public async Task<FailureFeedback?> CreatePendingAsync(
        PipelineFailure failure, AIAnalysis analysis, CreatedPullRequest pr,
        Guid orgId, CancellationToken ct = default)
    {
        if (orgId == Guid.Empty) return null;

        var fingerprint = ErrorFingerprintService.Compute(analysis.Category, analysis.KeyErrorLines);

        var feedback = new FailureFeedback
        {
            OrgId                  = orgId,
            PipelineFailureId      = failure.Id,
            Category               = analysis.Category,
            ErrorFingerprint       = fingerprint,
            OriginalFixSuggestion  = analysis.FixSuggestion,
            OriginalConfidence     = analysis.Confidence,
            Outcome                = FeedbackOutcome.Pending,
            PrNumber               = pr.PrNumber,
            PrUrl                  = pr.HtmlUrl,
            RepoOwner              = failure.RepoOwner,
            RepoName               = failure.RepoName,
        };

        _db.FailureFeedbacks.Add(feedback);
        await UpsertPatternAsync(orgId, analysis.Category, fingerprint, ct);
        await _db.SaveChangesAsync(ct);
        return feedback;
    }

    // ── Record outcomes ───────────────────────────────────────────

    public async Task RecordVcsOutcomeAsync(
        Guid orgId, int prNumber, string repoOwner, string repoName,
        FeedbackOutcome outcome, string? actualFix = null, CancellationToken ct = default)
    {
        var feedback = await _db.FailureFeedbacks
            .Where(f => f.OrgId == orgId
                     && f.PrNumber == prNumber
                     && f.RepoOwner == repoOwner
                     && f.RepoName  == repoName
                     && f.Outcome   == FeedbackOutcome.Pending)
            .FirstOrDefaultAsync(ct);

        if (feedback is null) return;

        ApplyOutcome(feedback, outcome, actualFix, "vcs_webhook");
        await UpdatePatternStatsAsync(orgId, feedback.Category, feedback.ErrorFingerprint, outcome,
            actualFix ?? feedback.OriginalFixSuggestion, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task RecordManualOutcomeAsync(
        Guid orgId, string failureId,
        FeedbackOutcome outcome, string? actualFix = null, CancellationToken ct = default)
    {
        var feedback = await _db.FailureFeedbacks
            .Where(f => f.OrgId == orgId && f.PipelineFailureId == failureId)
            .FirstOrDefaultAsync(ct);

        if (feedback is null) return;

        ApplyOutcome(feedback, outcome, actualFix, "manual");
        await UpdatePatternStatsAsync(orgId, feedback.Category, feedback.ErrorFingerprint, outcome,
            actualFix ?? feedback.OriginalFixSuggestion, ct);
        await _db.SaveChangesAsync(ct);
    }

    // ── Read ──────────────────────────────────────────────────────

    public async Task<FailureFeedback?> GetForFailureAsync(
        Guid orgId, string failureId, CancellationToken ct = default)
        => await _db.FailureFeedbacks
            .Where(f => f.OrgId == orgId && f.PipelineFailureId == failureId)
            .FirstOrDefaultAsync(ct);

    public async Task<(int total, List<FailurePattern> items)> GetPatternsAsync(
        Guid orgId, int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        var query = _db.FailurePatterns
            .Where(p => p.OrgId == orgId)
            .OrderByDescending(p => p.OccurrenceCount);

        var total = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return (total, items);
    }

    // ── AI prompt context (Pro+ only) ─────────────────────────────

    public async Task<string?> GetPromptContextAsync(
        Guid orgId, string category, string fingerprint, CancellationToken ct = default)
    {
        var pattern = await _db.FailurePatterns
            .Where(p => p.OrgId == orgId && p.Category == category && p.ErrorFingerprint == fingerprint)
            .FirstOrDefaultAsync(ct);

        // Need at least 2 occurrences and a successful fix to be useful
        if (pattern is null
            || pattern.OccurrenceCount < 2
            || string.IsNullOrWhiteSpace(pattern.LastSuccessfulFix))
            return null;

        var resolved = pattern.AcceptedCount + pattern.RejectedCount + pattern.ModifiedCount;
        if (resolved == 0) return null;

        var successCount = pattern.AcceptedCount + pattern.ModifiedCount;

        return $"""
            --- ORGANIZATION HISTORY ---
            This organization has encountered this exact failure pattern {pattern.OccurrenceCount} time(s).
            The following fix was accepted or merged {successCount} out of {resolved} time(s):

            "{pattern.LastSuccessfulFix}"

            Acceptance rate: {pattern.AcceptanceRate:P0} — use this to inform your confidence score.
            If the current failure matches this pattern, prefer the known fix and increase confidence accordingly.
            --- END HISTORY ---
            """;
    }

    public async Task RecordPatternOccurrenceAsync(
        Guid orgId, string category, string fingerprint, CancellationToken ct = default)
    {
        await UpsertPatternAsync(orgId, category, fingerprint, ct);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<FailurePattern?> GetPatternByFingerprintAsync(
        Guid orgId, string fingerprint, CancellationToken ct = default)
        => await _db.FailurePatterns
            .Where(p => p.OrgId == orgId && p.ErrorFingerprint == fingerprint)
            .FirstOrDefaultAsync(ct);

    // ── Private helpers ───────────────────────────────────────────

    private static void ApplyOutcome(FailureFeedback feedback, FeedbackOutcome outcome, string? actualFix, string source)
    {
        feedback.Outcome           = outcome;
        feedback.OutcomeRecordedAt = DateTime.UtcNow;
        feedback.OutcomeSource     = source;
        if (!string.IsNullOrWhiteSpace(actualFix))
            feedback.ActualFix = actualFix;
    }

    private async Task UpsertPatternAsync(Guid orgId, string category, string fingerprint, CancellationToken ct)
    {
        var pattern = await _db.FailurePatterns
            .Where(p => p.OrgId == orgId && p.Category == category && p.ErrorFingerprint == fingerprint)
            .FirstOrDefaultAsync(ct);

        if (pattern is null)
        {
            _db.FailurePatterns.Add(new FailurePattern
            {
                OrgId            = orgId,
                Category         = category,
                ErrorFingerprint = fingerprint,
                OccurrenceCount  = 1,
                FirstSeenAt      = DateTime.UtcNow,
                LastSeenAt       = DateTime.UtcNow,
            });
        }
        else
        {
            pattern.OccurrenceCount++;
            pattern.LastSeenAt = DateTime.UtcNow;
        }
    }

    private async Task UpdatePatternStatsAsync(
        Guid orgId, string category, string fingerprint,
        FeedbackOutcome outcome, string? fixText, CancellationToken ct)
    {
        var pattern = await _db.FailurePatterns
            .Where(p => p.OrgId == orgId && p.Category == category && p.ErrorFingerprint == fingerprint)
            .FirstOrDefaultAsync(ct);

        if (pattern is null) return;

        switch (outcome)
        {
            case FeedbackOutcome.Accepted:
                pattern.AcceptedCount++;
                if (!string.IsNullOrWhiteSpace(fixText))
                    pattern.LastSuccessfulFix = fixText;
                break;
            case FeedbackOutcome.Rejected:
                pattern.RejectedCount++;
                break;
            case FeedbackOutcome.Modified:
                pattern.ModifiedCount++;
                if (!string.IsNullOrWhiteSpace(fixText))
                    pattern.LastSuccessfulFix = fixText;
                break;
        }

        var total = pattern.AcceptedCount + pattern.RejectedCount + pattern.ModifiedCount;
        pattern.AcceptanceRate = total > 0
            ? (double)(pattern.AcceptedCount + pattern.ModifiedCount) / total
            : 0;
    }
}
