namespace FixMyBuildApi.Models;

/// <summary>
/// Denormalized aggregate of feedback per org + category + fingerprint.
/// Kept up-to-date by FeedbackService after each outcome is recorded.
/// Read by AIAnalyzerService to inject historical context into the prompt.
/// Composite unique index on (OrgId, Category, ErrorFingerprint).
/// </summary>
public class FailurePattern
{
    public Guid   Id               { get; set; } = Guid.NewGuid();
    public Guid   OrgId            { get; set; }
    public string Category         { get; set; } = string.Empty;
    public string ErrorFingerprint { get; set; } = string.Empty;

    // ── Occurrence counters ──────────────────────────────────────
    public int OccurrenceCount { get; set; }
    public int AcceptedCount   { get; set; }
    public int RejectedCount   { get; set; }
    public int ModifiedCount   { get; set; }

    // ── Computed stats ───────────────────────────────────────────
    /// <summary>Accepted+Modified / total resolved. Updated on every outcome.</summary>
    public double AcceptanceRate { get; set; }

    // ── AI prompt context ────────────────────────────────────────
    /// <summary>The most recently accepted or modified fix text. Injected into the AI prompt.</summary>
    public string? LastSuccessfulFix { get; set; }

    public DateTime FirstSeenAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenAt  { get; set; } = DateTime.UtcNow;
}
