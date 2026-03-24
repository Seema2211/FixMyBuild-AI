import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuthResponse, LoginRequest, RegisterRequest, UserDto } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;

  readonly currentUser = signal<UserDto | null>(this.loadUser());
  readonly isAuthenticated = signal<boolean>(!!this.getAccessToken());

  constructor(private readonly http: HttpClient) {}

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/register`, request).pipe(
      tap(res => this.saveSession(res))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/login`, request).pipe(
      tap(res => this.saveSession(res))
    );
  }

  refresh(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return throwError(() => new Error('No refresh token'));
    return this.http.post<AuthResponse>(`${this.apiUrl}/api/auth/refresh`, { refreshToken }).pipe(
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
      this.http.post(`${this.apiUrl}/api/auth/logout`, { refreshToken }).subscribe();
    }
    this.clearSession();
  }

  getAccessToken(): string | null {
    return localStorage.getItem('fmb_access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('fmb_refresh_token');
  }

  saveSession(res: AuthResponse): void {
    localStorage.setItem('fmb_access_token', res.accessToken);
    localStorage.setItem('fmb_refresh_token', res.refreshToken);
    localStorage.setItem('fmb_user', JSON.stringify(res.user));
    this.currentUser.set(res.user);
    this.isAuthenticated.set(true);
  }

  private clearSession(): void {
    localStorage.removeItem('fmb_access_token');
    localStorage.removeItem('fmb_refresh_token');
    localStorage.removeItem('fmb_user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  private loadUser(): UserDto | null {
    try {
      const raw = localStorage.getItem('fmb_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
