import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';

export interface OrgInfo {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  memberCount: number;
}

export interface SessionInfo {
  id: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(private http: HttpClient) {}

  updateName(firstName: string, lastName: string): Observable<{ firstName: string; lastName: string }> {
    return this.http.put<{ firstName: string; lastName: string }>(API_ROUTES.profile.update, { firstName, lastName });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(API_ROUTES.profile.changePassword, { currentPassword, newPassword });
  }

  changeEmail(newEmail: string, password: string): Observable<{ email: string; emailVerified: boolean }> {
    return this.http.put<{ email: string; emailVerified: boolean }>(API_ROUTES.profile.changeEmail, { newEmail, password });
  }

  getOrg(): Observable<OrgInfo> {
    return this.http.get<OrgInfo>(API_ROUTES.org.get);
  }

  updateOrg(name?: string, slug?: string): Observable<{ id: string; name: string; slug: string }> {
    return this.http.put<{ id: string; name: string; slug: string }>(API_ROUTES.org.update, { name, slug });
  }

  deleteOrg(password: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(API_ROUTES.org.delete, { body: { password } });
  }

  getSessions(): Promise<SessionInfo[]> {
    return firstValueFrom(this.http.get<SessionInfo[]>(API_ROUTES.profile.sessions));
  }

  revokeSession(id: string): Promise<{ message: string }> {
    return firstValueFrom(this.http.delete<{ message: string }>(API_ROUTES.profile.sessionById(id)));
  }

  revokeOtherSessions(currentRefreshToken?: string): Promise<{ message: string }> {
    return firstValueFrom(
      this.http.delete<{ message: string }>(API_ROUTES.profile.sessions, {
        body: { currentRefreshToken: currentRefreshToken ?? null }
      })
    );
  }
}
