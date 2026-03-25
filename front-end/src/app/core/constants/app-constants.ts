/** Plan identifiers — must match backend PlanType enum values (lowercased). */
export const PLAN_ID = {
  Free:     'free',
  Pro:      'pro',
  Business: 'business',
} as const;

export type PlanId = typeof PLAN_ID[keyof typeof PLAN_ID];

/** VCS provider keys — must match PipelineSource.Provider values in DB. */
export const VCS_PROVIDER = {
  GitHub:      'github',
  GitLab:      'gitlab',
  AzureDevOps: 'azure_devops',
  Bitbucket:   'bitbucket',
} as const;

/** AI analysis severity levels — must match backend Severity constants. */
export const SEVERITY = {
  Critical: 'critical',
  High:     'high',
  Medium:   'medium',
  Low:      'low',
} as const;

/** Map severity string → display emoji (mirrors backend Severity.Icon). */
export const SEVERITY_ICON: Record<string, string> = {
  critical: '🔴',
  high:     '🔴',
  medium:   '🟡',
  low:      '🟢',
};

/** Map severity string → Tailwind/CSS badge color class. */
export const SEVERITY_CLASS: Record<string, string> = {
  critical: 'badge-error',
  high:     'badge-error',
  medium:   'badge-warning',
  low:      'badge-success',
};

/** Minimum AI confidence % required for auto-PR — mirrors AutoFix.ConfidenceThreshold on backend. */
export const AUTO_PR_CONFIDENCE_THRESHOLD = 70;

/** Default page size for all paginated list views — mirrors Pagination.DefaultPageSize on backend. */
export const DEFAULT_PAGE_SIZE = 20;

/** Month string format used for usage tracking keys — mirrors DateFormats.Month on backend. */
export const MONTH_FORMAT = 'yyyy-MM';
