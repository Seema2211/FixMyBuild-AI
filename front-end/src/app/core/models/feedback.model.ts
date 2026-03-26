export type FeedbackOutcome = 'Pending' | 'Accepted' | 'Rejected' | 'Modified';

export interface FailureFeedback {
  id: string;
  outcome: FeedbackOutcome;
  outcomeSource: string | null;
  outcomeRecordedAt: string | null;
  originalConfidence: number;
  errorFingerprint: string;
  category: string;
  hasPr: boolean;
  prNumber: number | null;
  prUrl: string | null;
  createdAt: string;
}

export interface FailurePattern {
  id: string;
  category: string;
  errorFingerprint: string;
  occurrenceCount: number;
  acceptedCount: number;
  rejectedCount: number;
  modifiedCount: number;
  acceptanceRatePct: number;
  hasSuccessfulFix: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface PatternPage {
  total: number;
  page: number;
  pageSize: number;
  items: FailurePattern[];
}

export interface SubmitFeedbackRequest {
  outcome: Exclude<FeedbackOutcome, 'Pending'>;
  actualFix?: string;
}
