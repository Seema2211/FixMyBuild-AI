namespace FixMyBuildApi.Models;

public class PipelineAnalytics
{
    public ImpactMetrics Impact { get; set; } = new();
    public List<CategoryCount> CategoryDistribution { get; set; } = new();
    public List<DailyCount> DailyFailures7d { get; set; } = new();
    public List<DailyCount> DailyFailures30d { get; set; } = new();
    public List<ConfidenceBucket> ConfidenceDistribution { get; set; } = new();
    public List<RepoCount> TopRepos { get; set; } = new();

    // Enhanced trend data
    public List<DailySeverityCount> SeverityTrend7d { get; set; } = new();
    public List<DailySeverityCount> SeverityTrend30d { get; set; } = new();
    public List<DailyConfidenceAvg> ConfidenceTrend7d { get; set; } = new();
    public List<DailyConfidenceAvg> ConfidenceTrend30d { get; set; } = new();
    public MttrMetrics Mttr { get; set; } = new();
}

public class ImpactMetrics
{
    public int TotalAnalyzed { get; set; }
    public int AutoPRs { get; set; }
    /// <summary>Estimated manual debug hours without AI</summary>
    public double ManualHours { get; set; }
    /// <summary>Near-zero AI processing hours</summary>
    public double AiHours { get; set; }
    /// <summary>Hours saved = ManualHours - AiHours</summary>
    public double DevHoursSaved { get; set; }
}

public class CategoryCount
{
    public string Category { get; set; } = string.Empty;
    public int Count { get; set; }
    public string Color { get; set; } = "#6b7280";
}

public class DailyCount
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class ConfidenceBucket
{
    public string Range { get; set; } = string.Empty;
    public int Min { get; set; }
    public int Max { get; set; }
    public int Count { get; set; }
    public string Color { get; set; } = "#6b7280";
}

public class RepoCount
{
    public string Repo { get; set; } = string.Empty;
    public int Count { get; set; }
}

public class DailySeverityCount
{
    public string Date { get; set; } = string.Empty;
    public int High { get; set; }
    public int Medium { get; set; }
    public int Low { get; set; }
}

public class DailyConfidenceAvg
{
    public string Date { get; set; } = string.Empty;
    public double AvgConfidence { get; set; }
    public int Count { get; set; }
}

public class MttrMetrics
{
    /// <summary>Average minutes from failure to auto-PR creation</summary>
    public double AvgMinutesToPr { get; set; }
    /// <summary>Percentage of failures that got auto-PRs</summary>
    public double AutoFixRate { get; set; }
    /// <summary>Average confidence score across all analyses</summary>
    public double AvgConfidence { get; set; }
    /// <summary>Percentage of high severity failures</summary>
    public double HighSeverityRate { get; set; }
}
