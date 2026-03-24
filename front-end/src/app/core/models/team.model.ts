export interface TeamMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { email: string; firstName: string; lastName: string };
}

export interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  isExpired: boolean;
  invitedBy: string;
}

export interface CreateInvitationRequest {
  email: string;
  role?: string;
}

export interface CreateInvitationResponse {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  inviteToken: string;
}

export interface InvitePreview {
  email: string;
  role: string;
  orgName: string;
  expiresAt: string;
}
