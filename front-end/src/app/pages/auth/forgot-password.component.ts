import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatSnackBarModule],
  template: `
<div class="auth-shell">
  <div class="auth-card">
    <div class="auth-logo">
      <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
        <rect width="30" height="30" rx="8" fill="url(#lg3)"/>
        <path d="M9 21l6-12 6 12M11.5 17h7" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <defs><linearGradient id="lg3" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/>
        </linearGradient></defs>
      </svg>
      <span class="auth-logo-text">FixMyBuild <span class="grad">AI</span></span>
    </div>

    @if (!sent) {
      <h1 class="auth-title">Forgot password?</h1>
      <p class="auth-subtitle">Enter your work email and we'll send you a reset link.</p>

      <form class="auth-form" (ngSubmit)="submit()">
        <div class="field-group">
          <label class="field-label">Work email</label>
          <input type="email" class="field-input" placeholder="jane@company.com"
            [(ngModel)]="email" name="email" required autocomplete="email">
        </div>
        <button type="submit" class="btn-submit" [disabled]="loading">
          @if (loading) { <span class="spinner"></span> Sending... }
          @else { Send reset link }
        </button>
      </form>
    } @else {
      <div class="success-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <h1 class="auth-title">Check your inbox</h1>
      <p class="auth-subtitle">If <strong>{{ email }}</strong> is registered, a reset link has been sent. Check your spam folder if you don't see it.</p>
    }

    <p class="auth-footer">
      <a routerLink="/login" class="auth-link">← Back to sign in</a>
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
      position: relative; z-index: 1;
      background: rgba(255,255,255,0.97); border-radius: 20px; padding: 2.5rem;
      width: 100%; max-width: 420px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
    }
    .auth-logo { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 1.75rem; }
    .auth-logo-text { font-size: 1.125rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .grad { background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .auth-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; margin: 0 0 0.375rem; }
    .auth-subtitle { font-size: 0.9375rem; color: #6b7280; margin: 0 0 2rem; line-height: 1.5; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .field-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .field-label { font-size: 0.8125rem; font-weight: 700; color: #374151; }
    .field-input {
      width: 100%; padding: 0.6875rem 0.875rem; border: 1.5px solid #e5e7eb;
      border-radius: 10px; font-size: 0.9375rem; font-family: inherit;
      color: #111827; background: #f9fafb; box-sizing: border-box; transition: all 150ms ease;
      &:focus { outline: none; border-color: #4f46e5; background: white; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
      &::placeholder { color: #c0c5ce; }
    }
    .btn-submit {
      margin-top: 0.5rem; width: 100%; padding: 0.8125rem;
      background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;
      border: none; border-radius: 10px; font-size: 0.9375rem; font-weight: 700;
      font-family: inherit; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      box-shadow: 0 4px 14px rgba(79,70,229,0.35); transition: all 180ms ease;
      &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.45); }
      &:disabled { opacity: 0.7; cursor: not-allowed; }
    }
    .spinner { width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success-icon { display: flex; justify-content: center; margin-bottom: 1rem; }
    .auth-footer { margin-top: 1.5rem; text-align: center; font-size: 0.875rem; color: #6b7280; }
    .auth-link { color: #4f46e5; font-weight: 700; text-decoration: none; &:hover { color: #3730a3; } }
  `]
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  sent = false;

  constructor(
    private readonly http: HttpClient,
    private readonly snackBar: MatSnackBar,
  ) {}

  submit(): void {
    if (!this.email.trim()) return;
    this.loading = true;
    this.http.post(`${environment.apiUrl}/api/auth/forgot-password`, { email: this.email.trim() }).subscribe({
      next: () => { this.sent = true; this.loading = false; },
      error: () => { this.sent = true; this.loading = false; }, // always show success (anti-enumeration)
    });
  }
}
