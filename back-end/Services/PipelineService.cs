using FixMyBuildApi.Data;
using FixMyBuildApi.Models;
using Microsoft.EntityFrameworkCore;

namespace FixMyBuildApi.Services;

public class PipelineService : IPipelineService
{
    private readonly AppDbContext _db;
    private readonly IServiceScopeFactory _scopeFactory;
    private const int ConfidenceThresholdForAutoPr = 70;

    public PipelineService(AppDbContext db, IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _scopeFactory = scopeFactory;
    }

    public async Task ProcessFailuresAsync(string owner, string repo, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var github = scope.ServiceProvider.GetRequiredService<IGitHubService>();
        var aiAnalyzer = scope.ServiceProvider.GetRequiredService<IAIAnalyzerService>();

        var runs = await github.GetFailedRunsAsync(owner, repo, cancellationToken);
        foreach (var run in runs)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var id = $"{owner}:{repo}:{run.RunId}";

            // Skip already-processed runs
            if (await _db.PipelineFailures.AnyAsync(f => f.Id == id, cancellationToken))
                continue;

            try
            {
                var errorLog = await github.GetRunLogsAsync(owner, repo, run.RunId, cancellationToken);
                if (string.IsNullOrWhiteSpace(errorLog))
                    errorLog = "No error lines extracted from logs.";

                var analysis = await aiAnalyzer.AnalyzeLogsAsync(errorLog, cancellationToken);
                var failure = MapToPipelineFailure(id, run.WorkflowName, errorLog, owner, repo, run.RunId, run.HeadBranch, analysis, run);

                await UpsertAsync(failure, cancellationToken);

                // ── Send notification ──
                try
                {
                    var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    await notifService.NotifyFailureAsync(failure, cancellationToken);
                    failure.NotificationSent = true;
                    await UpsertAsync(failure, cancellationToken);
                }
                catch { /* Notification is best-effort */ }

                // ── Post AI analysis comment on any open PR for this branch ──
                if (!string.IsNullOrWhiteSpace(run.HeadBranch))
                {
                    try
                    {
                        var openPrs = await github.GetOpenPrsForBranchAsync(owner, repo, run.HeadBranch, cancellationToken);
                        if (openPrs.Count > 0 && analysis != null)
                        {
                            var comment = BuildPrComment(failure, analysis);
                            var (prNum, prUrl) = openPrs[0];
                            await github.PostPrCommentAsync(owner, repo, prNum, comment, cancellationToken);
                            failure.PrCommentPosted = true;
                            failure.SourcePrNumber = prNum;
                            failure.SourcePrUrl = prUrl;
                            await UpsertAsync(failure, cancellationToken);
                        }
                    }
                    catch { /* Comment posting is best-effort */ }
                }

                if (analysis != null && analysis.Confidence >= ConfidenceThresholdForAutoPr &&
                    !string.IsNullOrWhiteSpace(analysis.FixSuggestion))
                {
                    try
                    {
                        var branchName = $"fixmybuild/fix-{run.RunId}";
                        var fixContent = BuildFixContent(analysis.FixSuggestion, analysis.KeyErrorLines);
                        var pr = await github.CreatePullRequestAsync(owner, repo, branchName, fixContent,
                            $"Fix: {analysis.RootCause}",
                            $"Fix: {analysis.RootCause}",
                            $"AI-suggested fix for pipeline failure (confidence: {analysis.Confidence}%).\n\n{analysis.ErrorSummary}",
                            cancellationToken);

                        if (pr != null)
                        {
                            failure.CreatedPullRequest = pr;
                            await UpsertAsync(failure, cancellationToken);
                        }
                    }
                    catch { /* Keep failure without PR */ }
                }
            }
            catch
            {
                await UpsertAsync(new PipelineFailure
                {
                    Id = id,
                    PipelineName = run.WorkflowName,
                    Status = "failure",
                    ErrorLog = "Failed to fetch or analyze logs.",
                    RootCause = "Unknown",
                    Confidence = 0,
                    CreatedAt = DateTime.UtcNow,
                    RepoOwner = owner,
                    RepoName = repo,
                    RunId = run.RunId
                }, cancellationToken);
            }
        }
    }

    public async Task ProcessFailuresWithTokenAsync(string owner, string repo, string token, Guid? orgId = null, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var github = scope.ServiceProvider.GetRequiredService<IGitHubService>();
        var aiAnalyzer = scope.ServiceProvider.GetRequiredService<IAIAnalyzerService>();

        var runs = await github.GetFailedRunsAsync(owner, repo, token, cancellationToken);
        foreach (var run in runs)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var id = $"{owner}:{repo}:{run.RunId}";

            if (await _db.PipelineFailures.AnyAsync(f => f.Id == id, cancellationToken))
                continue;

            try
            {
                var errorLog = await github.GetRunLogsAsync(owner, repo, run.RunId, token, cancellationToken);
                if (string.IsNullOrWhiteSpace(errorLog))
                    errorLog = "No error lines extracted from logs.";

                var analysis = await aiAnalyzer.AnalyzeLogsAsync(errorLog, cancellationToken);
                var failure = MapToPipelineFailure(id, run.WorkflowName, errorLog, owner, repo, run.RunId, run.HeadBranch, analysis, run, orgId);

                await UpsertAsync(failure, cancellationToken);

                // ── Send notification ──
                try
                {
                    var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                    await notifService.NotifyFailureAsync(failure, cancellationToken);
                    failure.NotificationSent = true;
                    await UpsertAsync(failure, cancellationToken);
                }
                catch { /* Notification is best-effort */ }

                if (!string.IsNullOrWhiteSpace(run.HeadBranch))
                {
                    try
                    {
                        var openPrs = await github.GetOpenPrsForBranchAsync(owner, repo, run.HeadBranch, token, cancellationToken);
                        if (openPrs.Count > 0 && analysis != null)
                        {
                            var comment = BuildPrComment(failure, analysis);
                            var (prNum, prUrl) = openPrs[0];
                            await github.PostPrCommentAsync(owner, repo, prNum, comment, token, cancellationToken);
                            failure.PrCommentPosted = true;
                            failure.SourcePrNumber = prNum;
                            failure.SourcePrUrl = prUrl;
                            await UpsertAsync(failure, cancellationToken);
                        }
                    }
                    catch { /* Comment posting is best-effort */ }
                }

                if (analysis != null && analysis.Confidence >= ConfidenceThresholdForAutoPr &&
                    !string.IsNullOrWhiteSpace(analysis.FixSuggestion))
                {
                    try
                    {
                        var branchName = $"fixmybuild/fix-{run.RunId}";
                        var fixContent = BuildFixContent(analysis.FixSuggestion, analysis.KeyErrorLines);
                        var pr = await github.CreatePullRequestAsync(owner, repo, branchName, fixContent,
                            $"Fix: {analysis.RootCause}",
                            $"Fix: {analysis.RootCause}",
                            $"AI-suggested fix for pipeline failure (confidence: {analysis.Confidence}%).\n\n{analysis.ErrorSummary}",
                            token, cancellationToken);

                        if (pr != null)
                        {
                            failure.CreatedPullRequest = pr;
                            await UpsertAsync(failure, cancellationToken);
                        }
                    }
                    catch { /* Keep failure without PR */ }
                }
            }
            catch
            {
                await UpsertAsync(new PipelineFailure
                {
                    Id = id,
                    PipelineName = run.WorkflowName,
                    Status = "failure",
                    ErrorLog = "Failed to fetch or analyze logs.",
                    RootCause = "Unknown",
                    Confidence = 0,
                    CreatedAt = DateTime.UtcNow,
                    RepoOwner = owner,
                    RepoName = repo,
                    RunId = run.RunId,
                    OrganizationId = orgId
                }, cancellationToken);
            }
        }
    }

    public async Task<PipelineFailure?> AnalyzeSingleRunAsync(string owner, string repo, long runId, Guid? orgId = null, CancellationToken cancellationToken = default)
    {
        using var scope = _scopeFactory.CreateScope();
        var github = scope.ServiceProvider.GetRequiredService<IGitHubService>();
        var aiAnalyzer = scope.ServiceProvider.GetRequiredService<IAIAnalyzerService>();

        var runs = await github.GetFailedRunsAsync(owner, repo, cancellationToken);
        var run = runs.FirstOrDefault(r => r.RunId == runId);
        var workflowName = run?.WorkflowName ?? $"Run {runId}";
        var id = $"{owner}:{repo}:{runId}";

        try
        {
            var errorLog = await github.GetRunLogsAsync(owner, repo, runId, cancellationToken);
            if (string.IsNullOrWhiteSpace(errorLog))
                errorLog = "No error lines extracted from logs.";

            var analysis = await aiAnalyzer.AnalyzeLogsAsync(errorLog, cancellationToken);
            var headBranch = run?.HeadBranch;
            var failure = MapToPipelineFailure(id, workflowName, errorLog, owner, repo, runId, headBranch, analysis, run, orgId);

            await UpsertAsync(failure, cancellationToken);

            // ── Send notification ──
            try
            {
                var notifService = scope.ServiceProvider.GetRequiredService<INotificationService>();
                await notifService.NotifyFailureAsync(failure, cancellationToken);
                failure.NotificationSent = true;
                await UpsertAsync(failure, cancellationToken);
            }
            catch { /* Notification is best-effort */ }

            // Post comment on any open PR for this branch
            if (!string.IsNullOrWhiteSpace(headBranch) && analysis != null)
            {
                try
                {
                    var openPrs = await github.GetOpenPrsForBranchAsync(owner, repo, headBranch, cancellationToken);
                    if (openPrs.Count > 0)
                    {
                        var comment = BuildPrComment(failure, analysis);
                        var (prNum, prUrl) = openPrs[0];
                        await github.PostPrCommentAsync(owner, repo, prNum, comment, cancellationToken);
                        failure.PrCommentPosted = true;
                        failure.SourcePrNumber = prNum;
                        failure.SourcePrUrl = prUrl;
                        await UpsertAsync(failure, cancellationToken);
                    }
                }
                catch { /* Best-effort */ }
            }

            return failure;
        }
        catch
        {
            var fallback = new PipelineFailure
            {
                Id = id,
                PipelineName = workflowName,
                Status = "failure",
                ErrorLog = "Failed to fetch or analyze logs.",
                RootCause = "Unknown",
                Confidence = 0,
                CreatedAt = DateTime.UtcNow,
                RepoOwner = owner,
                RepoName = repo,
                RunId = runId
            };
            await UpsertAsync(fallback, cancellationToken);
            return fallback;
        }
    }

    public async Task<PipelinePage> GetAllFailuresAsync(string? search = null, string? severity = null, int page = 1, int pageSize = 20, Guid? orgId = null, CancellationToken cancellationToken = default)
    {
        var query = _db.PipelineFailures.AsQueryable();

        if (orgId.HasValue)
            query = query.Where(f => f.OrganizationId == orgId.Value);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(f =>
                f.PipelineName.ToLower().Contains(s) ||
                (f.RootCause != null && f.RootCause.ToLower().Contains(s)) ||
                (f.FailedStage != null && f.FailedStage.ToLower().Contains(s)) ||
                (f.RepoName != null && f.RepoName.ToLower().Contains(s)) ||
                (f.RepoOwner != null && f.RepoOwner.ToLower().Contains(s)));
        }

        if (!string.IsNullOrWhiteSpace(severity))
            query = query.Where(f => f.Severity != null && f.Severity.ToLower() == severity.ToLower());

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PipelinePage { Items = items, Total = total, Page = page, PageSize = pageSize };
    }

    public async Task<PipelineFailure?> GetFailureByIdAsync(string id, Guid? orgId = null, CancellationToken cancellationToken = default)
    {
        var failure = await _db.PipelineFailures.FindAsync(new object[] { id }, cancellationToken);
        if (failure is null) return null;
        if (orgId.HasValue && failure.OrganizationId != orgId.Value) return null;
        return failure;
    }

    public async Task<PipelineFailure?> UpdatePullRequestAsync(string failureId, CreatedPullRequest pr, CancellationToken cancellationToken = default)
    {
        var failure = await _db.PipelineFailures.FindAsync(new object[] { failureId }, cancellationToken);
        if (failure is null) return null;
        failure.CreatedPullRequest = pr;
        await _db.SaveChangesAsync(cancellationToken);
        return failure;
    }

    public async Task<PipelineStats> GetStatsAsync(Guid? orgId = null, CancellationToken cancellationToken = default)
    {
        var baseQuery = _db.PipelineFailures.AsQueryable();
        if (orgId.HasValue) baseQuery = baseQuery.Where(f => f.OrganizationId == orgId.Value);

        var total = await baseQuery.CountAsync(cancellationToken);
        var highSeverity = await baseQuery
            .CountAsync(f => f.Severity != null && f.Severity.ToLower() == "high", cancellationToken);
        var avgConfidence = total > 0
            ? await baseQuery.AverageAsync(f => (double)f.Confidence, cancellationToken)
            : 0.0;
        var prsCreated = await baseQuery
            .CountAsync(f => f.CreatedPullRequest!.HtmlUrl != null, cancellationToken);

        return new PipelineStats
        {
            TotalFailures = total,
            HighSeverityCount = highSeverity,
            AvgConfidence = Math.Round(avgConfidence, 1),
            PrsCreated = prsCreated
        };
    }

    public async Task<PipelineAnalytics> GetAnalyticsAsync(Guid? orgId = null, CancellationToken cancellationToken = default)
    {
        var query = _db.PipelineFailures.AsQueryable();
        if (orgId.HasValue) query = query.Where(f => f.OrganizationId == orgId.Value);
        var all = await query.ToListAsync(cancellationToken);

        // ── Impact Metrics ──────────────────────────────────────────────
        const double hoursToDebug = 2.5;
        const double hoursToPr = 1.0;
        var totalAnalyzed = all.Count;
        var autoPRs = all.Count(f => f.CreatedPullRequest?.HtmlUrl != null);
        var manualHours = Math.Round(totalAnalyzed * hoursToDebug + autoPRs * hoursToPr * 3, 1);
        var aiHours = Math.Round(totalAnalyzed * 0.04, 1); // ~2.4 min per analysis
        var saved = Math.Round(manualHours - aiHours, 1);

        // ── Category Distribution ────────────────────────────────────────
        var categoryColors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["dependency"]     = "#d97706",
            ["code"]           = "#4f46e5",
            ["configuration"]  = "#059669",
            ["test"]           = "#7c3aed",
            ["infrastructure"] = "#dc2626",
            ["security"]       = "#0891b2",
        };
        var categoryDist = all
            .GroupBy(f => string.IsNullOrWhiteSpace(f.Category) ? "Other" : f.Category,
                     StringComparer.OrdinalIgnoreCase)
            .Select(g => new CategoryCount
            {
                Category = g.Key,
                Count = g.Count(),
                Color = categoryColors.TryGetValue(g.Key, out var c) ? c : "#6b7280"
            })
            .OrderByDescending(c => c.Count)
            .ToList();

        // ── Daily Failures ───────────────────────────────────────────────
        var now = DateTime.UtcNow.Date;
        var daily7 = BuildDailyBuckets(all, now, 7);
        var daily30 = BuildDailyBuckets(all, now, 30);

        // ── Confidence Buckets ───────────────────────────────────────────
        var buckets = new[]
        {
            new ConfidenceBucket { Range = "80–100%", Min = 80, Max = 100, Color = "#059669" },
            new ConfidenceBucket { Range = "60–79%",  Min = 60, Max = 79,  Color = "#16a34a" },
            new ConfidenceBucket { Range = "40–59%",  Min = 40, Max = 59,  Color = "#d97706" },
            new ConfidenceBucket { Range = "20–39%",  Min = 20, Max = 39,  Color = "#f97316" },
            new ConfidenceBucket { Range = "0–19%",   Min = 0,  Max = 19,  Color = "#dc2626" },
        };
        foreach (var b in buckets)
            b.Count = all.Count(f => f.Confidence >= b.Min && f.Confidence <= b.Max);

        // ── Top Repos ────────────────────────────────────────────────────
        var topRepos = all
            .Where(f => !string.IsNullOrWhiteSpace(f.RepoOwner) && !string.IsNullOrWhiteSpace(f.RepoName))
            .GroupBy(f => $"{f.RepoOwner}/{f.RepoName}")
            .Select(g => new RepoCount { Repo = g.Key, Count = g.Count() })
            .OrderByDescending(r => r.Count)
            .Take(5)
            .ToList();

        // ── Severity Trend ──────────────────────────────────────────────
        var sevTrend7 = BuildSeverityTrend(all, now, 7);
        var sevTrend30 = BuildSeverityTrend(all, now, 30);

        // ── Confidence Trend ──────────────────────────────────────────────
        var confTrend7 = BuildConfidenceTrend(all, now, 7);
        var confTrend30 = BuildConfidenceTrend(all, now, 30);

        // ── MTTR Metrics ──────────────────────────────────────────────────
        var autoFixRate = totalAnalyzed > 0 ? Math.Round((double)autoPRs / totalAnalyzed * 100, 1) : 0;
        var avgConf = totalAnalyzed > 0 ? Math.Round(all.Average(f => (double)f.Confidence), 1) : 0;
        var highSevCount = all.Count(f => f.Severity?.ToLower() == "high");
        var highSevRate = totalAnalyzed > 0 ? Math.Round((double)highSevCount / totalAnalyzed * 100, 1) : 0;
        // Estimate MTTR: AI analysis takes ~2.4 min vs manual ~150 min
        var avgMinToPr = autoPRs > 0 ? 2.4 : 0;

        return new PipelineAnalytics
        {
            Impact = new ImpactMetrics
            {
                TotalAnalyzed = totalAnalyzed,
                AutoPRs = autoPRs,
                ManualHours = manualHours,
                AiHours = aiHours,
                DevHoursSaved = saved
            },
            CategoryDistribution = categoryDist,
            DailyFailures7d = daily7,
            DailyFailures30d = daily30,
            ConfidenceDistribution = buckets.ToList(),
            TopRepos = topRepos,
            SeverityTrend7d = sevTrend7,
            SeverityTrend30d = sevTrend30,
            ConfidenceTrend7d = confTrend7,
            ConfidenceTrend30d = confTrend30,
            Mttr = new MttrMetrics
            {
                AvgMinutesToPr = avgMinToPr,
                AutoFixRate = autoFixRate,
                AvgConfidence = avgConf,
                HighSeverityRate = highSevRate
            }
        };
    }

    private static List<DailyCount> BuildDailyBuckets(List<PipelineFailure> all, DateTime today, int days)
    {
        var result = new List<DailyCount>();
        for (int i = days - 1; i >= 0; i--)
        {
            var d = today.AddDays(-i);
            result.Add(new DailyCount
            {
                Date = d.ToString("MMM d"),
                Count = all.Count(f => f.CreatedAt.Date == d)
            });
        }
        return result;
    }

    private static List<DailySeverityCount> BuildSeverityTrend(List<PipelineFailure> all, DateTime today, int days)
    {
        var result = new List<DailySeverityCount>();
        for (int i = days - 1; i >= 0; i--)
        {
            var d = today.AddDays(-i);
            var dayItems = all.Where(f => f.CreatedAt.Date == d).ToList();
            result.Add(new DailySeverityCount
            {
                Date = d.ToString("MMM d"),
                High = dayItems.Count(f => f.Severity?.ToLower() == "high"),
                Medium = dayItems.Count(f => f.Severity?.ToLower() == "medium"),
                Low = dayItems.Count(f => f.Severity?.ToLower() == "low")
            });
        }
        return result;
    }

    private static List<DailyConfidenceAvg> BuildConfidenceTrend(List<PipelineFailure> all, DateTime today, int days)
    {
        var result = new List<DailyConfidenceAvg>();
        for (int i = days - 1; i >= 0; i--)
        {
            var d = today.AddDays(-i);
            var dayItems = all.Where(f => f.CreatedAt.Date == d).ToList();
            result.Add(new DailyConfidenceAvg
            {
                Date = d.ToString("MMM d"),
                AvgConfidence = dayItems.Count > 0 ? Math.Round(dayItems.Average(f => (double)f.Confidence), 1) : 0,
                Count = dayItems.Count
            });
        }
        return result;
    }

    public async Task SeedDemoDataAsync(Guid? orgId = null, CancellationToken cancellationToken = default)
    {
        // Only seed if no data exists for this org (or globally if orgId is null)
        var query = _db.PipelineFailures.AsQueryable();
        if (orgId.HasValue) query = query.Where(f => f.OrganizationId == orgId.Value);
        if (await query.AnyAsync(cancellationToken))
            return;

        var demos = new List<PipelineFailure>
        {
            new() {
                Id = "demo:sample-repo:1001",
                PipelineName = "CI / Build & Test",
                Status = "failure",
                FailedStage = "Run tests",
                ErrorSummary = "Unit tests failed due to missing environment variable",
                RootCause = "Missing DATABASE_URL environment variable in CI environment",
                Category = "Configuration",
                FixSuggestion = "Add DATABASE_URL to your repository secrets and reference it in the workflow YAML under env: DATABASE_URL: ${{ secrets.DATABASE_URL }}",
                KeyErrorLines = new List<string> { "Error: DATABASE_URL is not defined", "at Database.connect (db.js:12)", "Tests failed: 14 passed, 3 failed" },
                Severity = "high",
                Confidence = 92,
                Explanation = "The CI pipeline failed because a required environment variable is not configured.",
                ErrorLog = "##[error] Error: DATABASE_URL is not defined\n  at Database.connect (db.js:12:5)\n  Tests failed: 14 passed, 3 failed",
                RepoOwner = "demo",
                RepoName = "sample-repo",
                RunId = 1001,
                CreatedAt = DateTime.UtcNow.AddHours(-2)
            },
            new() {
                Id = "demo:sample-repo:1002",
                PipelineName = "Deploy to Production",
                Status = "failure",
                FailedStage = "Docker Build",
                ErrorSummary = "Docker build failed due to missing base image",
                RootCause = "Base image 'node:18-alpine' not found in private registry",
                Category = "Dependency",
                FixSuggestion = "Ensure the private registry is authenticated in the workflow and the base image tag exists. Add: docker login ${{ secrets.REGISTRY_URL }} before the build step.",
                KeyErrorLines = new List<string> { "ERROR: failed to solve: node:18-alpine: not found", "docker build failed with exit code 1" },
                Severity = "high",
                Confidence = 88,
                Explanation = "Docker build step failed because the base image could not be pulled.",
                ErrorLog = "Step 1/8 : FROM node:18-alpine\nERROR: failed to solve: node:18-alpine: not found\ndocker build failed with exit code 1",
                RepoOwner = "demo",
                RepoName = "sample-repo",
                RunId = 1002,
                HeadBranch = "feature/docker-registry-update",
                CreatedAt = DateTime.UtcNow.AddHours(-5),
                PrCommentPosted = true,
                SourcePrNumber = 38,
                SourcePrUrl = "https://github.com/demo/sample-repo/pull/38",
                CreatedPullRequest = new CreatedPullRequest
                {
                    PrNumber = 42,
                    HtmlUrl = "https://github.com/demo/sample-repo/pull/42",
                    BranchName = "fixmybuild/fix-1002",
                    Title = "Fix: Base image not found in private registry",
                    Body = "AI-suggested fix for pipeline failure (confidence: 88%).",
                    ChangesSummary = "Updated .github/workflows/deploy.yml to authenticate with private registry before docker build"
                }
            },
            new() {
                Id = "demo:sample-repo:1003",
                PipelineName = "Lint & Format Check",
                Status = "failure",
                FailedStage = "ESLint",
                ErrorSummary = "ESLint found 7 errors across 3 files",
                RootCause = "Unused variables and missing semicolons violating eslint rules",
                Category = "Code Quality",
                FixSuggestion = "Run 'npm run lint:fix' locally to auto-fix formatting issues, then commit the changes. Update .eslintrc to warn instead of error for unused-vars if intentional.",
                KeyErrorLines = new List<string> { "src/utils/helper.js: 'temp' is defined but never used", "src/api/index.js: Missing semicolon", "7 errors, 0 warnings" },
                Severity = "medium",
                Confidence = 95,
                Explanation = "Lint check failed due to code style violations.",
                ErrorLog = "src/utils/helper.js\n  12:7  error  'temp' is defined but never used  no-unused-vars\nsrc/api/index.js\n  45:1  error  Missing semicolon  semi\n7 errors, 0 warnings",
                RepoOwner = "demo",
                RepoName = "sample-repo",
                RunId = 1003,
                CreatedAt = DateTime.UtcNow.AddHours(-8)
            },
            new() {
                Id = "demo:sample-repo:1004",
                PipelineName = "CI / Build & Test",
                Status = "failure",
                FailedStage = "npm install",
                ErrorSummary = "npm install failed due to peer dependency conflict",
                RootCause = "react-dom@18 conflicts with legacy-peer-deps requirement from react-scripts@4",
                Category = "Dependency",
                FixSuggestion = "Add 'legacy-peer-deps=true' to .npmrc or upgrade react-scripts to v5+ which supports React 18.",
                KeyErrorLines = new List<string> { "npm ERR! ERESOLVE unable to resolve dependency tree", "npm ERR! peer react@\"^17.0.0\" from react-scripts@4.0.3", "npm ERR! Found: react@18.2.0" },
                Severity = "medium",
                Confidence = 85,
                Explanation = "Package installation failed due to conflicting peer dependencies.",
                ErrorLog = "npm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR! peer react@\"^17.0.0\" from react-scripts@4.0.3\nnpm ERR! Found: react@18.2.0",
                RepoOwner = "demo",
                RepoName = "sample-repo",
                RunId = 1004,
                CreatedAt = DateTime.UtcNow.AddDays(-1)
            },
            new() {
                Id = "demo:sample-repo:1005",
                PipelineName = "Security Scan",
                Status = "failure",
                FailedStage = "Snyk Security Check",
                ErrorSummary = "3 critical vulnerabilities found in dependencies",
                RootCause = "Outdated lodash@4.17.15 contains prototype pollution vulnerability (CVE-2021-23337)",
                Category = "Security",
                FixSuggestion = "Run 'npm audit fix' or manually upgrade lodash to ^4.17.21. Also update minimist and path-parse to their latest versions.",
                KeyErrorLines = new List<string> { "Critical: Prototype Pollution in lodash", "CVE-2021-23337 (CVSS 7.2)", "Fix available: upgrade lodash@4.17.21" },
                Severity = "high",
                Confidence = 97,
                Explanation = "Security scan detected critical vulnerabilities in npm packages.",
                ErrorLog = "Testing demo/sample-repo...\n\nCritical severity vulnerability found:\n  Prototype Pollution\n  Package: lodash\n  Version: 4.17.15\n  Fix: upgrade to >=4.17.21\n  CVE: CVE-2021-23337",
                RepoOwner = "demo",
                RepoName = "sample-repo",
                RunId = 1005,
                CreatedAt = DateTime.UtcNow.AddDays(-2)
            },
            new() {
                Id = "demo:sample-repo:1006",
                PipelineName = "Integration Tests",
                Status = "failure",
                FailedStage = "API Integration Tests",
                ErrorSummary = "Integration tests timed out connecting to external service",
                RootCause = "Third-party payment API endpoint unreachable during test run — no retry or mock configured",
                Category = "Infrastructure",
                FixSuggestion = "Add a mock server (e.g. WireMock or MSW) for the payment API in integration tests. Set PAYMENT_API_URL=http://localhost:8080 in the CI environment and configure the mock in test setup.",
                KeyErrorLines = new List<string> { "Error: connect ECONNREFUSED payments.stripe.com:443", "Timeout after 30000ms", "Integration test suite failed: 2/12 tests" },
                Severity = "low",
                Confidence = 78,
                Explanation = "Tests failed because external service was unreachable in CI environment.",
                ErrorLog = "FAIL src/tests/integration/payment.test.js\n  ● PaymentService › should process payment\n    Error: connect ECONNREFUSED payments.stripe.com:443\n    Timeout after 30000ms\n\nIntegration test suite failed: 2/12 tests",
                RepoOwner = "demo",
                RepoName = "sample-repo",
                RunId = 1006,
                CreatedAt = DateTime.UtcNow.AddDays(-3)
            },
            // ── Extra trend data across multiple days ──────────
            new() {
                Id = "demo:web-app:2001", PipelineName = "CI / Build", Status = "failure",
                FailedStage = "TypeScript Compile", ErrorSummary = "TS2345: Argument type mismatch",
                RootCause = "TypeScript strict mode caught type error in auth module",
                Category = "Code", FixSuggestion = "Fix the type assertion in src/auth/login.ts line 42.",
                KeyErrorLines = new List<string> { "TS2345: Argument of type 'string' is not assignable to parameter of type 'number'" },
                Severity = "medium", Confidence = 91, Explanation = "Type error in code.",
                ErrorLog = "TS2345 error", RepoOwner = "demo", RepoName = "web-app", RunId = 2001,
                CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-3)
            },
            new() {
                Id = "demo:web-app:2002", PipelineName = "E2E Tests", Status = "failure",
                FailedStage = "Playwright Tests", ErrorSummary = "Timeout waiting for login page",
                RootCause = "Login page selector changed after UI redesign",
                Category = "Test", FixSuggestion = "Update the Playwright selector from '#login-btn' to '[data-testid=login]'.",
                KeyErrorLines = new List<string> { "TimeoutError: waiting for selector '#login-btn'", "Test timeout of 30000ms exceeded" },
                Severity = "low", Confidence = 82, Explanation = "E2E test selector mismatch.",
                ErrorLog = "TimeoutError", RepoOwner = "demo", RepoName = "web-app", RunId = 2002,
                CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(-7)
            },
            new() {
                Id = "demo:api-service:3001", PipelineName = "CI / Build & Test", Status = "failure",
                FailedStage = "dotnet build", ErrorSummary = "Build failed due to missing NuGet package",
                RootCause = "Package 'Newtonsoft.Json' version 13.0.4 not found in configured feeds",
                Category = "Dependency", FixSuggestion = "Run 'dotnet restore' or add nuget.org as a package source in NuGet.config.",
                KeyErrorLines = new List<string> { "error NU1101: Unable to find package Newtonsoft.Json", "Build FAILED" },
                Severity = "high", Confidence = 94, Explanation = "NuGet restore failed.",
                ErrorLog = "NU1101 error", RepoOwner = "demo", RepoName = "api-service", RunId = 3001,
                CreatedAt = DateTime.UtcNow.AddDays(-2).AddHours(-2),
                CreatedPullRequest = new CreatedPullRequest {
                    PrNumber = 55, HtmlUrl = "https://github.com/demo/api-service/pull/55",
                    BranchName = "fixmybuild/fix-3001", Title = "Fix: Restore NuGet package source",
                    Body = "AI-suggested fix (confidence: 94%).", ChangesSummary = "Added nuget.org to NuGet.config"
                }
            },
            new() {
                Id = "demo:api-service:3002", PipelineName = "Deploy to Staging", Status = "failure",
                FailedStage = "Kubernetes Deploy", ErrorSummary = "Pod crashloop due to missing config map",
                RootCause = "ConfigMap 'app-settings' not found in staging namespace",
                Category = "Infrastructure", FixSuggestion = "Create the ConfigMap in staging: kubectl create configmap app-settings --from-file=config/",
                KeyErrorLines = new List<string> { "Error: configmaps 'app-settings' not found", "CrashLoopBackOff" },
                Severity = "high", Confidence = 76, Explanation = "Missing K8s config.",
                ErrorLog = "CrashLoopBackOff", RepoOwner = "demo", RepoName = "api-service", RunId = 3002,
                CreatedAt = DateTime.UtcNow.AddDays(-3).AddHours(-5)
            },
            new() {
                Id = "demo:mobile-app:4001", PipelineName = "iOS Build", Status = "failure",
                FailedStage = "xcodebuild", ErrorSummary = "Code signing error for distribution profile",
                RootCause = "Provisioning profile expired on March 15",
                Category = "Configuration", FixSuggestion = "Renew the provisioning profile in Apple Developer portal and update the CI secrets.",
                KeyErrorLines = new List<string> { "error: No signing certificate 'iOS Distribution' found", "Code signing is required" },
                Severity = "high", Confidence = 89, Explanation = "iOS signing failure.",
                ErrorLog = "Code signing error", RepoOwner = "demo", RepoName = "mobile-app", RunId = 4001,
                CreatedAt = DateTime.UtcNow.AddDays(-4).AddHours(-1)
            },
            new() {
                Id = "demo:mobile-app:4002", PipelineName = "Android Build", Status = "failure",
                FailedStage = "Gradle Build", ErrorSummary = "Gradle daemon OOM during build",
                RootCause = "Insufficient heap memory for Gradle daemon in CI runner",
                Category = "Infrastructure", FixSuggestion = "Increase Gradle JVM heap: add 'org.gradle.jvmargs=-Xmx4g' to gradle.properties.",
                KeyErrorLines = new List<string> { "java.lang.OutOfMemoryError: Java heap space", "Gradle build daemon disappeared unexpectedly" },
                Severity = "medium", Confidence = 87, Explanation = "OOM in Gradle build.",
                ErrorLog = "OutOfMemoryError", RepoOwner = "demo", RepoName = "mobile-app", RunId = 4002,
                CreatedAt = DateTime.UtcNow.AddDays(-4).AddHours(-6)
            },
            new() {
                Id = "demo:web-app:2003", PipelineName = "CI / Build", Status = "failure",
                FailedStage = "npm run build", ErrorSummary = "Webpack build failed on CSS module import",
                RootCause = "CSS modules file not found after directory restructure",
                Category = "Code", FixSuggestion = "Update import path from './styles/Button.module.css' to './components/Button/Button.module.css'.",
                KeyErrorLines = new List<string> { "Module not found: Error: Can't resolve './styles/Button.module.css'" },
                Severity = "medium", Confidence = 93, Explanation = "Import path error.",
                ErrorLog = "Module not found error", RepoOwner = "demo", RepoName = "web-app", RunId = 2003,
                CreatedAt = DateTime.UtcNow.AddDays(-5).AddHours(-4),
                CreatedPullRequest = new CreatedPullRequest {
                    PrNumber = 61, HtmlUrl = "https://github.com/demo/web-app/pull/61",
                    BranchName = "fixmybuild/fix-2003", Title = "Fix: Update CSS module import path",
                    Body = "AI-suggested fix (confidence: 93%).", ChangesSummary = "Fixed import path in Button component"
                }
            },
            new() {
                Id = "demo:sample-repo:1007", PipelineName = "CI / Build & Test", Status = "failure",
                FailedStage = "pytest", ErrorSummary = "Python tests failed on assertion error",
                RootCause = "API response format changed from list to paginated object",
                Category = "Test", FixSuggestion = "Update test assertion to check response['items'] instead of response directly.",
                KeyErrorLines = new List<string> { "AssertionError: assert {'items': [...]} == [...]", "FAILED tests/test_api.py::test_list_users" },
                Severity = "low", Confidence = 88, Explanation = "Test assertion mismatch.",
                ErrorLog = "AssertionError", RepoOwner = "demo", RepoName = "sample-repo", RunId = 1007,
                CreatedAt = DateTime.UtcNow.AddDays(-5).AddHours(-9)
            },
            new() {
                Id = "demo:api-service:3003", PipelineName = "Security Scan", Status = "failure",
                FailedStage = "Trivy Container Scan", ErrorSummary = "Critical CVE found in base image",
                RootCause = "Alpine 3.18 base image contains CVE-2024-0001 in libcrypto",
                Category = "Security", FixSuggestion = "Update FROM alpine:3.18 to FROM alpine:3.19 in Dockerfile.",
                KeyErrorLines = new List<string> { "CVE-2024-0001 (CRITICAL): libcrypto3", "Total: 1 critical, 3 high" },
                Severity = "high", Confidence = 96, Explanation = "Container vulnerability.",
                ErrorLog = "Trivy scan results", RepoOwner = "demo", RepoName = "api-service", RunId = 3003,
                CreatedAt = DateTime.UtcNow.AddDays(-6).AddHours(-2)
            },
            new() {
                Id = "demo:web-app:2004", PipelineName = "Lighthouse CI", Status = "failure",
                FailedStage = "Performance Audit", ErrorSummary = "Performance score below threshold",
                RootCause = "Unoptimized images and render-blocking JavaScript",
                Category = "Code", FixSuggestion = "Add lazy loading to images and defer non-critical JS. Use next/image for automatic optimization.",
                KeyErrorLines = new List<string> { "Performance: 42 (threshold: 80)", "LCP: 4.2s", "FID: 320ms" },
                Severity = "low", Confidence = 72, Explanation = "Performance audit failed.",
                ErrorLog = "Lighthouse audit failed", RepoOwner = "demo", RepoName = "web-app", RunId = 2004,
                CreatedAt = DateTime.UtcNow.AddDays(-6).AddHours(-8)
            }
        };

        if (orgId.HasValue)
            foreach (var d in demos)
                d.OrganizationId = orgId.Value;

        _db.PipelineFailures.AddRange(demos);
        await _db.SaveChangesAsync(cancellationToken);
    }

    private async Task UpsertAsync(PipelineFailure failure, CancellationToken cancellationToken)
    {
        var existing = await _db.PipelineFailures.FindAsync(new object[] { failure.Id }, cancellationToken);
        if (existing is null)
        {
            _db.PipelineFailures.Add(failure);
        }
        else
        {
            existing.PipelineName = failure.PipelineName;
            existing.Status = failure.Status;
            existing.ErrorLog = failure.ErrorLog;
            existing.FailedStage = failure.FailedStage;
            existing.ErrorSummary = failure.ErrorSummary;
            existing.RootCause = failure.RootCause;
            existing.Category = failure.Category;
            existing.FixSuggestion = failure.FixSuggestion;
            existing.KeyErrorLines = failure.KeyErrorLines;
            existing.Severity = failure.Severity;
            existing.Confidence = failure.Confidence;
            existing.Explanation = failure.Explanation;
            existing.Command = failure.Command;
            existing.CreatedAt = failure.CreatedAt;
            existing.RepoOwner = failure.RepoOwner;
            existing.RepoName = failure.RepoName;
            existing.RunId = failure.RunId;
            existing.HeadBranch = failure.HeadBranch;
            existing.CreatedPullRequest = failure.CreatedPullRequest;
            existing.PrCommentPosted = failure.PrCommentPosted;
            existing.SourcePrNumber = failure.SourcePrNumber;
            existing.SourcePrUrl = failure.SourcePrUrl;
            existing.ActorLogin = failure.ActorLogin;
            existing.ActorAvatarUrl = failure.ActorAvatarUrl;
            existing.CommitAuthorEmail = failure.CommitAuthorEmail;
            existing.CommitAuthorName = failure.CommitAuthorName;
            existing.NotificationSent = failure.NotificationSent;
        }
        await _db.SaveChangesAsync(cancellationToken);
    }

    private static string BuildFixContent(string fixSuggestion, List<string>? keyErrorLines)
    {
        var content = $"# Fix suggestion\n\n{fixSuggestion}";
        if (keyErrorLines?.Count > 0)
            content += "\n\n## Key error lines\n```\n" + string.Join("\n", keyErrorLines) + "\n```";
        return content;
    }

    private static PipelineFailure MapToPipelineFailure(string id, string workflowName, string errorLog,
        string owner, string repo, long runId, string? headBranch, AIAnalysis? analysis, PipelineRun? run = null, Guid? orgId = null)
    {
        return new PipelineFailure
        {
            Id = id,
            PipelineName = workflowName,
            Status = "failure",
            ErrorLog = errorLog,
            FailedStage = analysis?.FailedStage,
            ErrorSummary = analysis?.ErrorSummary,
            RootCause = analysis?.RootCause ?? "Analysis unavailable",
            Category = analysis?.Category,
            FixSuggestion = analysis?.FixSuggestion ?? "",
            KeyErrorLines = analysis?.KeyErrorLines ?? new List<string>(),
            Severity = analysis?.Severity,
            Confidence = analysis?.Confidence ?? 0,
            Explanation = analysis?.ErrorSummary ?? "",
            Command = "",
            CreatedAt = DateTime.UtcNow,
            RepoOwner = owner,
            RepoName = repo,
            RunId = runId,
            HeadBranch = headBranch,
            ActorLogin = run?.ActorLogin,
            ActorAvatarUrl = run?.ActorAvatarUrl,
            CommitAuthorEmail = run?.CommitAuthorEmail,
            CommitAuthorName = run?.CommitAuthorName,
            OrganizationId = orgId
        };
    }

    private static string BuildPrComment(PipelineFailure failure, AIAnalysis analysis)
    {
        var severityIcon = (analysis.Severity?.ToLower()) switch
        {
            "high"   => "🔴",
            "medium" => "🟡",
            "low"    => "🟢",
            _        => "⚪"
        };

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("## 🤖 FixMyBuild AI Analysis");
        sb.AppendLine();
        sb.AppendLine($"**Pipeline:** `{failure.PipelineName}`");
        if (!string.IsNullOrWhiteSpace(analysis.FailedStage))
            sb.AppendLine($"**Failed Stage:** `{analysis.FailedStage}`");
        sb.AppendLine($"**Severity:** {severityIcon} {analysis.Severity?.ToUpper() ?? "UNKNOWN"}  ");
        sb.AppendLine($"**Confidence:** {analysis.Confidence}%");
        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine();
        sb.AppendLine("### 🔍 Root Cause");
        sb.AppendLine(analysis.RootCause);
        sb.AppendLine();

        if (!string.IsNullOrWhiteSpace(analysis.FixSuggestion))
        {
            sb.AppendLine("### 💡 Suggested Fix");
            sb.AppendLine(analysis.FixSuggestion);
            sb.AppendLine();
        }

        if (analysis.KeyErrorLines?.Count > 0)
        {
            sb.AppendLine("### 🚨 Key Error Lines");
            sb.AppendLine("```");
            foreach (var line in analysis.KeyErrorLines)
                sb.AppendLine(line);
            sb.AppendLine("```");
            sb.AppendLine();
        }

        if (failure.CreatedPullRequest?.HtmlUrl != null)
            sb.AppendLine($"✅ **Auto-fix PR created → [{failure.CreatedPullRequest.Title}]({failure.CreatedPullRequest.HtmlUrl})**");

        sb.AppendLine();
        sb.AppendLine("---");
        sb.AppendLine("*Analyzed automatically by [FixMyBuild AI](https://github.com) · This comment is generated by AI and may require human review.*");

        return sb.ToString();
    }
}
