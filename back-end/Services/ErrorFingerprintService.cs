using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace FixMyBuildApi.Services;

/// <summary>
/// Produces a short, stable fingerprint from an AI-analysed failure's category + key error lines.
/// Used as the lookup key for FailurePattern — two failures with the same fingerprint are
/// considered the same error pattern regardless of timestamps, line numbers, or log verbosity.
/// </summary>
public static class ErrorFingerprintService
{
    /// <summary>
    /// Returns a 16-character lowercase hex string identifying this error pattern.
    /// Deterministic: same category + same normalized error lines → same fingerprint.
    /// </summary>
    public static string Compute(string category, IEnumerable<string> keyErrorLines)
    {
        var normalized = keyErrorLines
            .Take(5)           // stability: top 5 key lines only
            .Select(Normalize)
            .Where(l => l.Length > 0)
            .ToList();

        var input = $"{category.ToLowerInvariant()}:{string.Join("|", normalized)}";
        var hash  = SHA256.HashData(Encoding.UTF8.GetBytes(input));
        return Convert.ToHexString(hash)[..16].ToLowerInvariant();
    }

    private static string Normalize(string line)
    {
        // Strip ISO timestamps  e.g. "2024-01-15T10:23:45.123Z"
        line = Regex.Replace(line, @"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[\.\d]*Z?", "");
        // Strip column/line refs  e.g. ":42:10"
        line = Regex.Replace(line, @":\d+:\d+", "");
        // Strip hex addresses  e.g. "0x7f8b4c2a"
        line = Regex.Replace(line, @"0x[0-9a-fA-F]+", "");
        // Strip GUIDs / UUIDs
        line = Regex.Replace(line, @"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", "", RegexOptions.IgnoreCase);
        // Collapse whitespace, lowercase
        return Regex.Replace(line, @"\s+", " ").Trim().ToLowerInvariant();
    }
}
