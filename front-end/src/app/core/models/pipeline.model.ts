export interface PipelineListItem {
  id: string;
  pipelineName: string;
  status: string;
  rootCause: string;
  confidence: number;
  failedStage?: string;
  severity?: string;
  category?: string;
  repoOwner?: string;
  repoName?: string;
  createdAt?: string;
  headBranch?: string;
  prCommentPosted?: boolean;
  sourcePrNumber?: number;
  sourcePrUrl?: string;
  createdPullRequest?: {
    htmlUrl: string;
    branchName: string;
    prNumber?: number;
  };
}

export interface CreatedPullRequest {
  prNumber: number;
  htmlUrl: string;
  branchName: string;
  title: string;
  body: string;
  changesSummary: string;
}

export interface PipelineDetails {
  id: string;
  pipelineName: string;
  status: string;
  errorLog: string;
  rootCause: string;
  explanation: string;
  fixSuggestion: string;
  command: string;
  confidence: number;
  createdAt: string;
  repoOwner?: string;
  repoName?: string;
  headBranch?: string;
  prCommentPosted?: boolean;
  sourcePrNumber?: number;
  sourcePrUrl?: string;
  createdPullRequest?: CreatedPullRequest;
  /** Richer analysis for DevOps insight card */
  failedStage?: string;
  errorSummary?: string;
  category?: string;
  keyErrorLines?: string[];
  severity?: string;
}

export interface PipelinePage {
  items: PipelineListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PipelineStats {
  totalFailures: number;
  highSeverityCount: number;
  avgConfidence: number;
  prsCreated: number;
}

export interface CreatePrRequest {
  pipelineFailureId: string;
  branchName?: string;
  repoOwner: string;
  repoName: string;
}

export interface CategoryCount {
  category: string;
  count: number;
  color: string;
}

export interface DailyCount {
  date: string;
  count: number;
}

export interface ConfidenceBucket {
  range: string;
  min: number;
  max: number;
  count: number;
  color: string;
}

export interface RepoCount {
  repo: string;
  count: number;
}

export interface ImpactMetrics {
  totalAnalyzed: number;
  autoPRs: number;
  manualHours: number;
  aiHours: number;
  devHoursSaved: number;
}

export interface PipelineAnalytics {
  impact: ImpactMetrics;
  categoryDistribution: CategoryCount[];
  dailyFailures7d: DailyCount[];
  dailyFailures30d: DailyCount[];
  confidenceDistribution: ConfidenceBucket[];
  topRepos: RepoCount[];
  severityTrend7d: DailySeverityCount[];
  severityTrend30d: DailySeverityCount[];
  confidenceTrend7d: DailyConfidenceAvg[];
  confidenceTrend30d: DailyConfidenceAvg[];
  mttr: MttrMetrics;
}

export interface DailySeverityCount {
  date: string;
  high: number;
  medium: number;
  low: number;
}

export interface DailyConfidenceAvg {
  date: string;
  avgConfidence: number;
  count: number;
}

export interface MttrMetrics {
  avgMinutesToPr: number;
  autoFixRate: number;
  avgConfidence: number;
  highSeverityRate: number;
}

export interface AnalyzeRequest {
  owner: string;
  repo: string;
  runId: number;
}
