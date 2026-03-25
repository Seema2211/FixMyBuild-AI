namespace FixMyBuildApi.Constants;

/// <summary>AI analysis severity levels — single source of truth for both backend logic and PR comments.</summary>
public static class Severity
{
    public const string Critical = "critical";
    public const string High     = "high";
    public const string Medium   = "medium";
    public const string Low      = "low";

    public static string Icon(string? severity) => severity?.ToLower() switch
    {
        Critical => "🔴",
        High     => "🔴",
        Medium   => "🟡",
        Low      => "🟢",
        _        => "⚪"
    };
}

/// <summary>VCS provider keys — must match PipelineSource.Provider values in DB.</summary>
public static class VcsProvider
{
    public const string GitHub      = "github";
    public const string GitLab      = "gitlab";
    public const string AzureDevOps = "azure_devops";
    public const string Bitbucket   = "bitbucket";
}

/// <summary>Pipeline failure status values.</summary>
public static class FailureStatus
{
    public const string Failure          = "failure";
    public const string AlreadyProcessed = "already_processed";
    public const string Processed        = "processed";
}

/// <summary>Pagination defaults shared across all list endpoints.</summary>
public static class Pagination
{
    public const int DefaultPageSize = 20;
    public const int MaxPageSize     = 100;
}

/// <summary>Date/time format strings used consistently throughout the system.</summary>
public static class DateFormats
{
    /// <summary>Monthly usage tracking key format, e.g. "2026-03".</summary>
    public const string Month    = "yyyy-MM";
    public const string DateTime = "yyyy-MM-dd HH:mm";
}

/// <summary>Auto-fix thresholds — shared knowledge between service and documentation.</summary>
public static class AutoFix
{
    /// <summary>Minimum AI confidence % required to trigger auto-PR creation.</summary>
    public const int ConfidenceThreshold = 70;
}
