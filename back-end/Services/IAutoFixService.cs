using FixMyBuildApi.Models;

namespace FixMyBuildApi.Services;

public record AutoFixResult(
    CreatedPullRequest? PullRequest,
    bool CommentPosted,
    string? SkippedReason = null
);

/// <summary>
/// Single entry-point for all auto-fix actions: AI comment on open PRs + fix PR creation.
/// Enforces subscription plan limits, picks the right VCS provider, and sources the token
/// exclusively from the org's PipelineSource — never from config.
/// Call this from every trigger point (ingest API, GitHub monitor, UI manual trigger, setup wizard).
/// </summary>
public interface IAutoFixService
{
    /// <param name="failure">The saved pipeline failure to act on.</param>
    /// <param name="analysis">
    ///   Fresh AI analysis if available; pass null to reconstruct from data already stored on
    ///   <paramref name="failure"/> (used for manual triggers where analysis was already run).
    /// </param>
    /// <param name="orgId">
    ///   Owning organization — used to enforce plan limits and look up the VCS token.
    ///   Pass <see cref="Guid.Empty"/> only for legacy config-based monitor paths with no org context.
    /// </param>
    /// <param name="forceCreate">
    ///   When true the 70% confidence gate is bypassed (manual "Create PR" button).
    ///   Plan limits are still enforced regardless.
    /// </param>
    Task<AutoFixResult> RunAsync(
        PipelineFailure failure,
        AIAnalysis? analysis,
        Guid orgId,
        bool forceCreate = false,
        CancellationToken ct = default);
}
