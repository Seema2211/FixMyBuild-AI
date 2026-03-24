using System.IO.Compression;

namespace FixMyBuildApi.Helpers;

public static class GitHubLogHelper
{
    /// <summary>
    /// Downloads the logs zip from the given URL and extracts text content,
    /// then returns lines filtered by LogExtractor.
    /// </summary>
    public static async Task<string> DownloadAndExtractErrorLinesAsync(
        HttpClient httpClient,
        string logsZipUrl,
        CancellationToken cancellationToken = default)
    {
        using var response = await httpClient.GetAsync(logsZipUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var fullText = await ExtractTextFromZipAsync(stream, cancellationToken);
        return LogExtractor.ExtractErrorLines(fullText);
    }

    public static async Task<string> ExtractTextFromZipAsync(Stream zipStream, CancellationToken cancellationToken)
    {
        var sb = new System.Text.StringBuilder();
        using var archive = new ZipArchive(zipStream, ZipArchiveMode.Read);

        foreach (var entry in archive.Entries)
        {
            if (entry.Length == 0 || !IsTextFile(entry.Name))
                continue;

            await using var entryStream = entry.Open();
            using var reader = new StreamReader(entryStream);
            var content = await reader.ReadToEndAsync(cancellationToken);
            sb.AppendLine($"[{entry.FullName}]");
            sb.AppendLine(content);
        }

        return sb.ToString();
    }

    private static bool IsTextFile(string name)
    {
        var ext = Path.GetExtension(name).ToLowerInvariant();
        return ext is ".txt" or ".log" or "" || name.EndsWith(".log", StringComparison.OrdinalIgnoreCase);
    }
}
