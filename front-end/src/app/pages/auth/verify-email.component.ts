import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="auth-shell">
  <div class="auth-card">
    <div class="auth-logo">
      <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
        <rect width="30" height="30" rx="8" fill="url(#lg5)"/>
        <path d="M9 21l6-12 6 12M11.5 17h7" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <defs><linearGradient id="lg5" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/>
        </linearGradient></defs>
      </svg>
      <span class="auth-logo-text">FixMyBuild <span class="grad">AI</span></span>
    </div>

    @if (loading) {
      <div class="spinner-wrap">
        <div class="spinner-lg"></div>
      </div>
      <h1 class="auth-title">Verifying your email…</h1>
    } @else if (success) {
      <div class="success-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <h1 class="auth-title">Email verified!</h1>
      <p class="auth-subtitle">Your email address has been confirmed. Your account is fully active.</p>
    } @else {
      <div class="error-icon">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </div>
      <h1 class="auth-title">Verification failed</h1>
      <p class="auth-subtitle">{{ errorMessage }}</p>
    }

    <p class="auth-footer">
      <a routerLink="/" class="auth-link">Go to dashboard →</a>
    </p>
  </div>
  <div class="bg-glow bg-glow-1"></div>
  <div class="bg-glow bg-glow-2"></div>
</div>
  `,
  styles: [`
    :host { display: block; }
    .auth-shell {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      padding: 2rem; position: relative; overflow: hidden;
    }
    .bg-glow { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(80px); }
    .bg-glow-1 { width: 500px; height: 500px; top: -100px; right: -100px; background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%); }
    .bg-glow-2 { width: 400px; height: 400px; bottom: -80px; left: -80px; background: radial-gradient(circle, rgba(168,85,247,0.12), transparent 70%); }
    .auth-card {
      position: relative; z-index: 1; text-align: center;
      background: rgba(255,255,255,0.97); border-radius: 20px; padding: 2.5rem;
      width: 100%; max-width: 420px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
    }
    .auth-logo { display: flex; align-items: center; justify-content: center; gap: 0.625rem; margin-bottom: 1.75rem; }
    .auth-logo-text { font-size: 1.125rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .grad { background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .auth-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; margin: 0 0 0.375rem; }
    .auth-subtitle { font-size: 0.9375rem; color: #6b7280; margin: 0 0 1.5rem; line-height: 1.5; }
    .spinner-wrap { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .spinner-lg { width: 44px; height: 44px; border: 3px solid #e5e7eb; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success-icon, .error-icon { display: flex; justify-content: center; margin-bottom: 1rem; }
    .auth-footer { margin-top: 1rem; text-align: center; font-size: 0.875rem; color: #6b7280; }
    .auth-link { color: #4f46e5; font-weight: 700; text-decoration: none; &:hover { color: #3730a3; } }
  `]
})
export class VerifyEmailComponent implements OnInit {
  loading = true;
  success = false;
  errorMessage = 'The verification link is invalid or has expired.';

  constructor(
    private readonly http: HttpClient,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.errorMessage = 'No verification token found.';
      return;
    }
    this.http.post(`${environment.apiUrl}/api/auth/verify-email`, { token }).subscribe({
      next: () => { this.success = true; this.loading = false; },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Verification link is invalid or has expired.';
        this.loading = false;
      },
    });
  }
}
