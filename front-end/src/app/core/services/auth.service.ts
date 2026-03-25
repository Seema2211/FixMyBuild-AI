import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import { STORAGE_KEYS } from '../constants/storage-keys';
import type { AuthResponse, LoginRequest, RegisterRequest, UserDto } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<UserDto | null>(this.loadUser());
  readonly isAuthenticated = signal<boolean>(!!this.getAccessToken());

  constructor(private readonly http: HttpClient) {}

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ROUTES.auth.register, request).pipe(
      tap(res => this.saveSession(res))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(API_ROUTES.auth.login, request).pipe(
      tap(res => this.saveSession(res))
    );
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token'));
    return this.http.post<AuthResponse>(API_ROUTES.auth.refresh, { refreshToken }).pipe(
      tap(res => this.saveSession(res)),
      catchError(err => {
        this.clearSession();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(API_ROUTES.auth.logout, { refreshToken }).subscribe();
    }
    this.clearSession();
  }

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AccessToken);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.RefreshToken);
  }

  updateUser(patch: Partial<UserDto>): void {
    const current = this.currentUser();
    if (!current) return;
    const updated = { ...current, ...patch };
    localStorage.setItem(STORAGE_KEYS.User, JSON.stringify(updated));
    this.currentUser.set(updated);
  }

  saveSession(res: AuthResponse): void {
    localStorage.setItem(STORAGE_KEYS.AccessToken, res.accessToken);
    localStorage.setItem(STORAGE_KEYS.RefreshToken, res.refreshToken);
    localStorage.setItem(STORAGE_KEYS.User, JSON.stringify(res.user));
    this.currentUser.set(res.user);
    this.isAuthenticated.set(true);
  }

  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.AccessToken);
    localStorage.removeItem(STORAGE_KEYS.RefreshToken);
    localStorage.removeItem(STORAGE_KEYS.User);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  private loadUser(): UserDto | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.User);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
