namespace FixMyBuildApi.Models;

public class PipelineStats
{
    public int TotalFailures { get; set; }
    public int HighSeverityCount { get; set; }
    public double AvgConfidence { get; set; }
    public int PrsCreated { get; set; }
}
