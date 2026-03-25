import { environment } from '../../../environments/environment';

const B = environment.apiUrl; // base URL

/**
 * Centralized API route definitions.
 * Every HTTP call in every service must use a route from this object.
 * Changing a backend path? Change it here — fixed everywhere automatically.
 */
export const API_ROUTES = {

  // ── Auth ──────────────────────────────────────────────────────────────
  auth: {
    register:           `${B}/api/auth/register`,
    login:              `${B}/api/auth/login`,
    refresh:            `${B}/api/auth/refresh`,
    logout:             `${B}/api/auth/logout`,
    forgotPassword:     `${B}/api/auth/forgot-password`,
    resetPassword:      `${B}/api/auth/reset-password`,
    verifyEmail:        `${B}/api/auth/verify-email`,
    resendVerification: `${B}/api/auth/resend-verification`,
  },

  // ── Billing ───────────────────────────────────────────────────────────
  billing: {
    plans:      `${B}/api/billing/plans`,
    plan:       `${B}/api/billing/plan`,
    checkout:   `${B}/api/billing/checkout`,
    portal:     `${B}/api/billing/portal`,
    usage:      `${B}/api/billing/usage`,
    cancel:     `${B}/api/billing/cancel`,
    reactivate: `${B}/api/billing/reactivate`,
  },

  // ── Pipelines ─────────────────────────────────────────────────────────
  pipelines: {
    list:      `${B}/api/pipelines`,
    stats:     `${B}/api/pipelines/stats`,
    analytics: `${B}/api/pipelines/analytics`,
    analyze:   `${B}/api/pipelines/analyze`,
    createPr:  `${B}/api/pipelines/create-pr`,
    byId:      (id: string) => `${B}/api/pipelines/${encodeURIComponent(id)}`,
    demoSeed:  `${B}/api/demo/seed`,
    stream:    (token: string) => `${B}/api/pipelines/stream?token=${encodeURIComponent(token)}`,
  },

  // ── Configuration / Sources ───────────────────────────────────────────
  config: {
    sources:          `${B}/api/config/sources`,
    sourceById:       (id: number) => `${B}/api/config/sources/${id}`,
    testSource:       (id: number) => `${B}/api/config/sources/${id}/test`,
    repos:            (sourceId: number) => `${B}/api/config/sources/${sourceId}/repos`,
    repoById:         (repoId: number) => `${B}/api/config/repos/${repoId}`,
    notifications:    `${B}/api/config/notifications`,
    testSlack:        `${B}/api/config/notifications/test-slack`,
    testEmail:        `${B}/api/config/notifications/test-email`,
    apiKeys:          `${B}/api/config/api-keys`,
    apiKeyById:       (id: string) => `${B}/api/config/api-keys/${id}`,
  },

  // ── Notifications (in-app bell) ───────────────────────────────────────
  notifications: {
    list:        (page = 1) => `${B}/api/notifications?page=${page}`,
    unreadCount: `${B}/api/notifications/unread-count`,
    markRead:    (id: string) => `${B}/api/notifications/${id}/read`,
    markAllRead: `${B}/api/notifications/read-all`,
  },

  // ── Outbound Webhooks ─────────────────────────────────────────────────
  webhooks: {
    list:       `${B}/api/webhooks`,
    byId:       (id: string) => `${B}/api/webhooks/${id}`,
    deliveries: (id: string, page = 1, pageSize = 20) =>
                  `${B}/api/webhooks/${id}/deliveries?page=${page}&pageSize=${pageSize}`,
    test:       (id: string) => `${B}/api/webhooks/${id}/test`,
  },

  // ── Team ──────────────────────────────────────────────────────────────
  team: {
    members:        `${B}/api/team/members`,
    memberRole:     (userId: string) => `${B}/api/team/members/${userId}/role`,
    memberById:     (userId: string) => `${B}/api/team/members/${userId}`,
    invitations:    `${B}/api/team/invitations`,
    invitationById: (id: string) => `${B}/api/team/invitations/${id}`,
    invitePreview:  (token: string) => `${B}/api/invitations/preview?token=${token}`,
  },

  // ── Profile & Org ─────────────────────────────────────────────────────
  profile: {
    update:          `${B}/api/profile`,
    changePassword:  `${B}/api/profile/password`,
    changeEmail:     `${B}/api/profile/email`,
    sessions:        `${B}/api/profile/sessions`,
    sessionById:     (id: string) => `${B}/api/profile/sessions/${id}`,
  },
  org: {
    get:    `${B}/api/org`,
    update: `${B}/api/org`,
    delete: `${B}/api/org`,
  },

  // ── Audit Log ─────────────────────────────────────────────────────────
  audit: {
    logs: `${B}/api/audit`,
  },

  // ── Admin (SuperAdmin only) ───────────────────────────────────────────
  admin: {
    stats:         `${B}/api/admin/stats`,
    organizations: `${B}/api/admin/organizations`,
    orgById:       (id: string) => `${B}/api/admin/organizations/${id}`,
    subscriptions: `${B}/api/admin/subscriptions`,
    failures:      `${B}/api/admin/failures`,
    usage:         `${B}/api/admin/usage`,
  },

  // ── Onboarding ────────────────────────────────────────────────────────
  onboarding: {
    status: `${B}/api/onboarding/status`,
  },

  // ── Ingest (API key auth) ─────────────────────────────────────────────
  ingest: `${B}/api/ingest`,

} as const;
