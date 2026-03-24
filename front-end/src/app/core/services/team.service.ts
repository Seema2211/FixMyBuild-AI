import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  TeamMember,
  PendingInvitation,
  CreateInvitationRequest,
  CreateInvitationResponse,
  InvitePreview,
} from '../models/team.model';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // ── Members ────────────────────────────────────────────────────

  getMembers(): Observable<TeamMember[]> {
    return this.http.get<TeamMember[]>(`${this.apiUrl}/api/team/members`);
  }

  updateRole(userId: string, role: string): Observable<{ userId: string; role: string }> {
    return this.http.put<{ userId: string; role: string }>(
      `${this.apiUrl}/api/team/members/${userId}/role`, { role });
  }

  removeMember(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/team/members/${userId}`);
  }

  // ── Invitations ────────────────────────────────────────────────

  getInvitations(): Observable<PendingInvitation[]> {
    return this.http.get<PendingInvitation[]>(`${this.apiUrl}/api/team/invitations`);
  }

  createInvitation(req: CreateInvitationRequest): Observable<CreateInvitationResponse> {
    return this.http.post<CreateInvitationResponse>(`${this.apiUrl}/api/team/invitations`, req);
  }

  revokeInvitation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/team/invitations/${id}`);
  }

  // ── Public ─────────────────────────────────────────────────────

  previewInvite(token: string): Observable<InvitePreview> {
    return this.http.get<InvitePreview>(`${this.apiUrl}/api/invitations/preview?token=${token}`);
  }
}
