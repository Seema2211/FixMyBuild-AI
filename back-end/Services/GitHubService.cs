using System.Net.Http.Headers;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text;
using FixMyBuildApi.Helpers;
using FixMyBuildApi.Models;
using Microsoft.Extensions.Configuration;

namespace FixMyBuildApi.Services;

public class GitHubService : IGitHubService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private string _token;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    public GitHubService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
    {
        _httpClientFactory = httpClientFactory;
        _token = configuration["GITHUB_TOKEN"] ?? "";
    }

    public async Task<IReadOnlyList<PipelineRun>> GetFailedRunsAsync(string owner, string repo, CancellationToken cancellationToken = default)
    {
        var client = CreateGitHubClient();
        var url = $"repos/{owner}/{repo}/actions/runs?per_page=30";
        var response = await client.GetAsync(url, cancellationToken);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var data = JsonSerializer.Deserialize<GitHubActionsRunsResponse>(json, JsonOptions);
        if (data?.WorkflowRuns == null)
            return Array.Empty<PipelineRun>();

        return data.WorkflowRuns
            .Where(r => string.Equals(r.Conclusion, "failure", StringComparison.OrdinalIgnoreCase))
            .Select(r => new PipelineRun
            {
                RunId = r.Id,
                Repository = $"{owner}/{repo}",
                WorkflowName = r.Name ?? r.Path ?? "Unknown",
                Status = r.Status ?? "completed",
                Conclusion = r.Conclusion,
                CreatedAt = r.CreatedAt,
                HeadBranch = r.HeadBranch,
                ActorLogin = r.Actor?.Login,
                ActorAvatarUrl = r.Actor?.AvatarUrl,
                CommitAuthorEmail = r.HeadCommit?.Author?.Email,
                CommitAuthorName = r.HeadCommit?.Author?.Name
            })
            .ToList();
    }

    public async Task<string> GetRunLogsAsync(string owner, string repo, long runId, CancellationToken cancellationToken = default)
    {
        var client = CreateGitHubClient();
        var logsUrl = $"repos/{owner}/{repo}/actions/runs/{runId}/logs";

        // GitHub returns 302 redirect to the actual zip URL (e.g. codeload.github.com)
        using var request = new HttpRequestMessage(HttpMethod.Get, logsUrl);
        using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        var redirectUrl = response.Headers.Location?.ToString();
        if (!string.IsNullOrEmpty(redirectUrl))
        {
            // Use a separate client for the redirect (different host); buffer full response to avoid "connection forcibly closed" during stream read
            var downloadClient = _httpClientFactory.CreateClient("GitHubLogsDownload");
            using var downloadRequest = new HttpRequestMessage(HttpMethod.Get, redirectUrl);
            downloadRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _token);
            using var downloadResponse = await downloadClient.SendAsync(downloadRequest, cancellationToken);
            downloadResponse.EnsureSuccessStatusCode();
            // Read entire response into memory first to avoid connection drops while reading the zip stream
            var bytes = await downloadResponse.Content.ReadAsByteArrayAsync(cancellationToken);
            await using var stream = new MemoryStream(bytes);
            var fullText = await GitHubLogHelper.ExtractTextFromZipAsync(stream, cancellationToken);
            return LogExtractor.ExtractErrorLines(fullText);
        }

        var directBytes = await response.Content.ReadAsByteArrayAsync(cancellationToken);
        await using var directStream = new MemoryStream(directBytes);
        var text = await GitHubLogHelper.ExtractTextFromZipAsync(directStream, cancellationToken);
        return LogExtractor.ExtractErrorLines(text);
    }

    public async Task<CreatedPullRequest?> CreatePullRequestAsync(string owner, string repo, string branchName, string fixContent, string commitMessage, string prTitle, string prBody, CancellationToken cancellationToken = default)
    {
        var client = CreateGitHubClient();
        var basePath = $"repos/{owner}/{repo}";

        // 1) Get default branch and latest commit sha
        var repoInfo = await client.GetAsync($"{basePath}", cancellationToken);
        repoInfo.EnsureSuccessStatusCode();
        var repoJson = await repoInfo.Content.ReadAsStringAsync(cancellationToken);
        var repoData = JsonSerializer.Deserialize<GitHubRepoResponse>(repoJson, JsonOptions);
        var defaultBranch = repoData?.DefaultBranch ?? "main";

        var refPath = $"{basePath}/git/ref/heads/{defaultBranch}";
        var refResponse = await client.GetAsync(refPath, cancellationToken);
        refResponse.EnsureSuccessStatusCode();
        var refJson = await refResponse.Content.ReadAsStringAsync(cancellationToken);
        var refData = JsonSerializer.Deserialize<GitHubRefResponse>(refJson, JsonOptions);
        var latestSha = refData?.Object?.Sha;
        if (string.IsNullOrEmpty(latestSha))
            return null;

        // 2) Create new branch (if it already exists, 422 is OK - we continue and use existing branch)
        var createRefBody = JsonSerializer.Serialize(new { @ref = $"refs/heads/{branchName}", sha = latestSha });
        using (var createRefReq = new HttpRequestMessage(HttpMethod.Post, $"{basePath}/git/refs")
        {
            Content = new StringContent(createRefBody, Encoding.UTF8, "application/json")
        })
        {
            var createRefRes = await client.SendAsync(createRefReq, cancellationToken);
            if (!createRefRes.IsSuccessStatusCode && createRefRes.StatusCode != System.Net.HttpStatusCode.UnprocessableEntity)
                return null;
            // 422 = Reference already exists -> branch is there, proceed to update file and create/find PR
        }

        // 3) Create or update file with fix suggestion (e.g. FIX_SUGGESTION.md)
        const string fixFileName = "FIX_SUGGESTION.md";
        var contentBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(fixContent));
        var createFileBody = JsonSerializer.Serialize(new
        {
            message = commitMessage,
            content = contentBase64,
            branch = branchName
        }, JsonOptions);
        using var createFileReq = new HttpRequestMessage(HttpMethod.Put, $"{basePath}/contents/{fixFileName}")
        {
            Content = new StringContent(createFileBody, Encoding.UTF8, "application/json")
        };
        var createFileRes = await client.SendAsync(createFileReq, cancellationToken);
        if (!createFileRes.IsSuccessStatusCode)
        {
            // 422 may mean file already exists - need to send current sha to update
            if (createFileRes.StatusCode == System.Net.HttpStatusCode.UnprocessableEntity)
            {
                var getContentRes = await client.GetAsync($"{basePath}/contents/{fixFileName}?ref={Uri.EscapeDataString(branchName)}", cancellationToken);
                if (getContentRes.IsSuccessStatusCode)
                {
                    var getContentJson = await getContentRes.Content.ReadAsStringAsync(cancellationToken);
                    var contentData = JsonSerializer.Deserialize<GitHubContentResponse>(getContentJson, JsonOptions);
                    var updateFileBody = JsonSerializer.Serialize(new
                    {
                        message = commitMessage,
                        content = contentBase64,
                        branch = branchName,
                        sha = contentData?.Sha
                    }, JsonOptions);
                    using var updateFileReq = new HttpRequestMessage(HttpMethod.Put, $"{basePath}/contents/{fixFileName}")
                    {
                        Content = new StringContent(updateFileBody, Encoding.UTF8, "application/json")
                    };
                    var updateFileRes = await client.SendAsync(updateFileReq, cancellationToken);
                    if (!updateFileRes.IsSuccessStatusCode)
                        return null;
                }
                else
                    return null;
            }
            else
                return null;
        }

        // 4) Create pull request (if one already exists for this branch, return it)
        var prBodyPayload = JsonSerializer.Serialize(new { title = prTitle, body = prBody, head = branchName, @base = defaultBranch }, JsonOptions);
        using var prReq = new HttpRequestMessage(HttpMethod.Post, $"{basePath}/pulls")
        {
            Content = new StringContent(prBodyPayload, Encoding.UTF8, "application/json")
        };
        var prResponse = await client.SendAsync(prReq, cancellationToken);
        if (prResponse.IsSuccessStatusCode)
        {
            var prJson = await prResponse.Content.ReadAsStringAsync(cancellationToken);
            var prData = JsonSerializer.Deserialize<GitHubPullRequestResponse>(prJson, JsonOptions);
            if (prData == null) return null;
            return new CreatedPullRequest
            {
                PrNumber = prData.Number,
                HtmlUrl = prData.HtmlUrl ?? "",
                BranchName = branchName,
                Title = prTitle,
                Body = prBody,
                ChangesSummary = $"Added/updated {fixFileName} with recommended fix."
            };
        }
        if (prResponse.StatusCode == System.Net.HttpStatusCode.UnprocessableEntity)
        {
            // "A pull request already exists" - fetch existing open PR for this branch
            var pullsRes = await client.GetAsync($"{basePath}/pulls?head={owner}:{branchName}&state=open", cancellationToken);
            if (!pullsRes.IsSuccessStatusCode) return null;
            var pullsJson = await pullsRes.Content.ReadAsStringAsync(cancellationToken);
            var pulls = JsonSerializer.Deserialize<List<GitHubPullRequestResponse>>(pullsJson, JsonOptions);
            var existing = pulls?.FirstOrDefault();
            if (existing != null)
                return new CreatedPullRequest
                {
                    PrNumber = existing.Number,
                    HtmlUrl = existing.HtmlUrl ?? "",
                    BranchName = branchName,
                    Title = prTitle,
                    Body = prBody,
                    ChangesSummary = $"Updated {fixFileName}; existing PR #{existing.Number}."
                };
        }
        return null;
    }

    public async Task<List<(int Number, string HtmlUrl)>> GetOpenPrsForBranchAsync(
        string owner, string repo, string branch, CancellationToken cancellationToken = default)
    {
        var client = CreateGitHubClient();
        // head filter format: {owner}:{branch}
        var url = $"repos/{owner}/{repo}/pulls?head={Uri.EscapeDataString(owner)}:{Uri.EscapeDataString(branch)}&state=open&per_page=5";
        var response = await client.GetAsync(url, cancellationToken);
        if (!response.IsSuccessStatusCode) return new();

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        var pulls = JsonSerializer.Deserialize<List<GitHubPrListItem>>(json, JsonOptions);
        return pulls?
            .Select(p => (p.Number, p.HtmlUrl ?? ""))
            .ToList() ?? new();
    }

    public async Task PostPrCommentAsync(
        string owner, string repo, int prNumber, string body, CancellationToken cancellationToken = default)
    {
        var client = CreateGitHubClient();
        // GitHub Issues API is used for PR comments (PRs are issues)
        var url = $"repos/{owner}/{repo}/issues/{prNumber}/comments";
        var payload = JsonSerializer.Serialize(new { body });
        using var request = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = new StringContent(payload, Encoding.UTF8, "application/json")
        };
        var response = await client.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
    }

    // ── Token-overridden methods for multi-source support ──────────────

    public Task<IReadOnlyList<PipelineRun>> GetFailedRunsAsync(string owner, string repo, string token, CancellationToken cancellationToken = default)
    {
        var original = _token;
        return WithToken(token, () => GetFailedRunsAsync(owner, repo, cancellationToken));
    }

    public Task<string> GetRunLogsAsync(string owner, string repo, long runId, string token, CancellationToken cancellationToken = default)
    {
        return WithToken(token, () => GetRunLogsAsync(owner, repo, runId, cancellationToken));
    }

    public Task<CreatedPullRequest?> CreatePullRequestAsync(string owner, string repo, string branchName, string fixContent, string commitMessage, string prTitle, string prBody, string token, CancellationToken cancellationToken = default)
    {
        return WithToken(token, () => CreatePullRequestAsync(owner, repo, branchName, fixContent, commitMessage, prTitle, prBody, cancellationToken));
    }

    public Task<List<(int Number, string HtmlUrl)>> GetOpenPrsForBranchAsync(string owner, string repo, string branch, string token, CancellationToken cancellationToken = default)
    {
        return WithToken(token, () => GetOpenPrsForBranchAsync(owner, repo, branch, cancellationToken));
    }

    public Task PostPrCommentAsync(string owner, string repo, int prNumber, string body, string token, CancellationToken cancellationToken = default)
    {
        return WithToken(token, () => PostPrCommentAsync(owner, repo, prNumber, body, cancellationToken));
    }

    private async Task<T> WithToken<T>(string token, Func<Task<T>> action)
    {
        var saved = _token;
        _token = token;
        try { return await action(); }
        finally { _token = saved; }
    }

    private async Task WithToken(string token, Func<Task> action)
    {
        var saved = _token;
        _token = token;
        try { await action(); }
        finally { _token = saved; }
    }

    private HttpClient CreateGitHubClient()
    {
        var client = _httpClientFactory.CreateClient("GitHub");
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        client.DefaultRequestHeaders.UserAgent.ParseAdd("FixMyBuild-AI");
        return client;
    }

    private class GitHubActionsRunsResponse
    {
        [JsonPropertyName("workflow_runs")]
        public List<GitHubWorkflowRun>? WorkflowRuns { get; set; }
    }

    private class GitHubWorkflowRun
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }
        [JsonPropertyName("name")]
        public string? Name { get; set; }
        [JsonPropertyName("path")]
        public string? Path { get; set; }
        [JsonPropertyName("status")]
        public string? Status { get; set; }
        [JsonPropertyName("conclusion")]
        public string? Conclusion { get; set; }
        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }
        [JsonPropertyName("head_branch")]
        public string? HeadBranch { get; set; }
        [JsonPropertyName("actor")]
        public GitHubActor? Actor { get; set; }
        [JsonPropertyName("head_commit")]
        public GitHubHeadCommit? HeadCommit { get; set; }
    }

    private class GitHubActor
    {
        [JsonPropertyName("login")]
        public string? Login { get; set; }
        [JsonPropertyName("avatar_url")]
        public string? AvatarUrl { get; set; }
    }

    private class GitHubHeadCommit
    {
        [JsonPropertyName("author")]
        public GitHubCommitAuthor? Author { get; set; }
    }

    private class GitHubCommitAuthor
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }
        [JsonPropertyName("email")]
        public string? Email { get; set; }
    }

    private class GitHubRepoResponse
    {
        [JsonPropertyName("default_branch")]
        public string? DefaultBranch { get; set; }
    }

    private class GitHubRefResponse
    {
        [JsonPropertyName("object")]
        public GitHubRefObject? Object { get; set; }
    }

    private class GitHubRefObject
    {
        [JsonPropertyName("sha")]
        public string? Sha { get; set; }
    }

    private class GitHubPullRequestResponse
    {
        [JsonPropertyName("number")]
        public int Number { get; set; }
        [JsonPropertyName("html_url")]
        public string? HtmlUrl { get; set; }
    }

    private class GitHubContentResponse
    {
        [JsonPropertyName("sha")]
        public string? Sha { get; set; }
    }

    private class GitHubPrListItem
    {
        [JsonPropertyName("number")]
        public int Number { get; set; }
        [JsonPropertyName("html_url")]
        public string? HtmlUrl { get; set; }
    }
}
