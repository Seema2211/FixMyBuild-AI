export interface AuditEntry {
  id: string;
  action: string;
  actorEmail: string | null;
  targetEmail: string | null;
  details: string | null;
  createdAt: string;
}

export interface AuditLogResponse {
  total: number;
  page: number;
  pageSize: number;
  items: AuditEntry[];
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  'user.registered':      'User Registered',
  'user.login':           'User Login',
  'invite.sent':          'Invite Sent',
  'invite.accepted':      'Invite Accepted',
  'invite.revoked':       'Invite Revoked',
  'member.role_changed':  'Role Changed',
  'member.removed':       'Member Removed',
  'apikey.created':       'API Key Created',
  'apikey.revoked':       'API Key Revoked',
};

export const AUDIT_ACTION_COLORS: Record<string, string> = {
  'user.registered':      'green',
  'user.login':           'blue',
  'invite.sent':          'purple',
  'invite.accepted':      'green',
  'invite.revoked':       'orange',
  'member.role_changed':  'orange',
  'member.removed':       'red',
  'apikey.created':       'purple',
  'apikey.revoked':       'red',
};
