namespace FixMyBuildApi.Helpers;

public static class LogExtractor
{
    private static readonly string[] ErrorKeywords = { "error", "exception", "failed" };

    /// <summary>
    /// Filters log lines that contain error, exception, or failed (case-insensitive).
    /// </summary>
    public static string ExtractErrorLines(string fullLog)
    {
        if (string.IsNullOrWhiteSpace(fullLog))
            return string.Empty;

        var lines = fullLog.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);
        var errorLines = lines.Where(line =>
            ErrorKeywords.Any(kw => line.Contains(kw, StringComparison.OrdinalIgnoreCase)));

        return string.Join(Environment.NewLine, errorLines);
    }
}
