export interface PipelineSource {
  id: number;
  name: string;
  provider: string;
  baseUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tokenConfigured: boolean;
  maskedToken: string;
  repositories: ConnectedRepository[];
}

export interface ConnectedRepository {
  id: number;
  pipelineSourceId: number;
  fullName: string;
  isActive: boolean;
  autoAnalyze: boolean;
  autoCreatePr: boolean;
  lastSyncedAt?: string;
  createdAt: string;
}

export interface CreateSourceRequest {
  name: string;
  provider: string;
  baseUrl?: string;
  accessToken: string;
  isActive?: boolean;
}

export interface UpdateSourceRequest {
  name?: string;
  provider?: string;
  baseUrl?: string;
  accessToken?: string;
  isActive?: boolean;
}

export interface AddRepoRequest {
  fullName: string;
  isActive?: boolean;
  autoAnalyze?: boolean;
  autoCreatePr?: boolean;
}

export interface UpdateRepoRequest {
  fullName?: string;
  isActive?: boolean;
  autoAnalyze?: boolean;
  autoCreatePr?: boolean;
}

export interface TestConnectionResult {
  connected: boolean;
}

// ── Notification Settings ──────────────────────────────────
export interface NotificationSettings {
  id: number;
  slackWebhookUrl?: string;
  slackEnabled: boolean;
  smtpHost?: string;
  smtpPort: number;
  smtpUsername?: string;
  smtpPassword?: string;
  smtpFromEmail?: string;
  smtpUseSsl: boolean;
  emailEnabled: boolean;
  notifyPrAuthor: boolean;
  additionalRecipients?: string;
  notifyOnHigh: boolean;
  notifyOnMedium: boolean;
  notifyOnLow: boolean;
  updatedAt: string;
}

export interface TestResult {
  success: boolean;
}

// ── API Keys ──────────────────────────────────────────────────
export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  rawKey: string;
}
