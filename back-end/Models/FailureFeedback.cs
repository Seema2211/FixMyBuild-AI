namespace FixMyBuildApi.Models;

public enum FeedbackOutcome { Pending, Accepted, Rejected, Modified }

/// <summary>
/// Tracks the outcome of every AI fix suggestion that resulted in a PR.
/// One row per PR created by AutoFixService.
/// Outcome is set automatically via VCS webhook or manually via the UI.
/// </summary>
public class FailureFeedback
{
    public Guid   Id                  { get; set; } = Guid.NewGuid();
    public Guid   OrgId               { get; set; }
    public string PipelineFailureId   { get; set; } = string.Empty;

    // ── Pattern identification ───────────────────────────────────
    public string Category            { get; set; } = string.Empty; // from AIAnalysis
    public string ErrorFingerprint    { get; set; } = string.Empty; // computed by ErrorFingerprintService

    // ── Fix content ──────────────────────────────────────────────
    public string  OriginalFixSuggestion { get; set; } = string.Empty;
    public string? ActualFix             { get; set; } // set when outcome = Modified

    // ── Outcome ──────────────────────────────────────────────────
    public FeedbackOutcome Outcome          { get; set; } = FeedbackOutcome.Pending;
    public string?         OutcomeSource    { get; set; } // "vcs_webhook" | "manual"
    public DateTime?       OutcomeRecordedAt { get; set; }

    // ── Original AI metadata ─────────────────────────────────────
    public int OriginalConfidence { get; set; }

    // ── PR reference (for VCS webhook matching) ──────────────────
    public int?    PrNumber   { get; set; }
    public string? PrUrl      { get; set; }
    public string? RepoOwner  { get; set; }
    public string? RepoName   { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
