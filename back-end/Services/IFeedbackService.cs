using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public interface IFeedbackService
{
    /// <summary>
    /// Called by AutoFixService immediately after a PR is created.
    /// Creates a Pending feedback record and bumps the pattern occurrence counter.
    /// </summary>
    Task<FailureFeedback?> CreatePendingAsync(
        PipelineFailure failure, AIAnalysis analysis, CreatedPullRequest pr,
        Guid orgId, CancellationToken ct = default);

    /// <summary>
    /// Records outcome from a VCS webhook event (PR merged or closed).
    /// Looks up the feedback record by PR number + repo coordinates.
    /// </summary>
    Task RecordVcsOutcomeAsync(
        Guid orgId, int prNumber, string repoOwner, string repoName,
        FeedbackOutcome outcome, string? actualFix = null, CancellationToken ct = default);

    /// <summary>
    /// Records outcome from a manual UI action (thumbs up/down or modified text).
    /// </summary>
    Task RecordManualOutcomeAsync(
        Guid orgId, string failureId,
        FeedbackOutcome outcome, string? actualFix = null, CancellationToken ct = default);

    /// <summary>Returns the feedback record for a specific failure (for UI display).</summary>
    Task<FailureFeedback?> GetForFailureAsync(Guid orgId, string failureId, CancellationToken ct = default);

    /// <summary>
    /// Paginated list of aggregated patterns for analytics dashboard.
    /// Caller is responsible for enforcing the Analytics plan limit before calling this.
    /// </summary>
    Task<(int total, List<FailurePattern> items)> GetPatternsAsync(
        Guid orgId, int page = 1, int pageSize = 20, CancellationToken ct = default);

    /// <summary>
    /// Returns a formatted context string to inject into the AI prompt for Pro+ orgs.
    /// Returns null if no history exists or the pattern has fewer than 2 occurrences.
    /// </summary>
    Task<string?> GetPromptContextAsync(
        Guid orgId, string category, string fingerprint, CancellationToken ct = default);

    /// <summary>
    /// Bumps the pattern occurrence counter when a new failure matches an existing pattern.
    /// Called by AIAnalyzerService after first-pass analysis (best-effort, non-blocking).
    /// </summary>
    Task RecordPatternOccurrenceAsync(
        Guid orgId, string category, string fingerprint, CancellationToken ct = default);

    /// <summary>Returns a single pattern by fingerprint for the given org, or null if not found.</summary>
    Task<FailurePattern?> GetPatternByFingerprintAsync(
        Guid orgId, string fingerprint, CancellationToken ct = default);
}
