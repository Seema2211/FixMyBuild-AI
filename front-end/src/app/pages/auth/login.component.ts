import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatSnackBarModule],
  template: `
<div class="auth-shell">
  <div class="auth-card">
    <!-- Logo -->
    <div class="auth-logo">
      <svg width="36" height="36" viewBox="0 0 30 30" fill="none">
        <rect width="30" height="30" rx="8" fill="url(#lg)"/>
        <path d="M9 21l6-12 6 12M11.5 17h7" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <defs><linearGradient id="lg" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/>
        </linearGradient></defs>
      </svg>
      <span class="auth-logo-text">FixMyBuild <span class="grad">AI</span></span>
    </div>

    <h1 class="auth-title">Welcome back</h1>
    <p class="auth-subtitle">Sign in to your workspace</p>

    <form class="auth-form" (ngSubmit)="submit()" #form="ngForm">
      <div class="field-group">
        <label class="field-label">Email address</label>
        <input type="email" class="field-input" placeholder="you@company.com"
          [(ngModel)]="email" name="email" required autocomplete="email">
      </div>

      <div class="field-group">
        <div class="field-label-row">
          <label class="field-label">Password</label>
        </div>
        <div class="input-wrapper">
          <input [type]="showPassword ? 'text' : 'password'" class="field-input"
            placeholder="Your password"
            [(ngModel)]="password" name="password" required autocomplete="current-password">
          <button type="button" class="input-eye" (click)="showPassword = !showPassword" tabindex="-1">
            @if (!showPassword) {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            } @else {
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
            }
          </button>
        </div>
      </div>

      <button type="submit" class="btn-submit" [disabled]="loading">
        @if (loading) {
          <span class="spinner"></span> Signing in...
        } @else {
          Sign in
        }
      </button>
    </form>

    <p class="auth-footer" style="margin-top:1rem">
      <a routerLink="/forgot-password" class="auth-link">Forgot password?</a>
    </p>

    <p class="auth-footer">
      Don't have an account?
      <a routerLink="/register" class="auth-link">Create one free</a>
    </p>
  </div>

  <!-- Background decoration -->
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
    .bg-glow {
      position: absolute; border-radius: 50%; pointer-events: none; filter: blur(80px);
    }
    .bg-glow-1 {
      width: 500px; height: 500px; top: -100px; right: -100px;
      background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%);
    }
    .bg-glow-2 {
      width: 400px; height: 400px; bottom: -80px; left: -80px;
      background: radial-gradient(circle, rgba(168,85,247,0.12), transparent 70%);
    }

    .auth-card {
      position: relative; z-index: 1;
      background: rgba(255,255,255,0.97);
      border-radius: 20px; padding: 2.5rem;
      width: 100%; max-width: 420px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
    }

    .auth-logo {
      display: flex; align-items: center; gap: 0.625rem;
      margin-bottom: 1.75rem;
    }
    .auth-logo-text {
      font-size: 1.125rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;
    }
    .grad { background: linear-gradient(135deg, #6366f1, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

    .auth-title {
      font-size: 1.625rem; font-weight: 800; color: #0f172a;
      letter-spacing: -0.03em; margin: 0 0 0.375rem;
    }
    .auth-subtitle { font-size: 0.9375rem; color: #6b7280; margin: 0 0 2rem; }

    .auth-form { display: flex; flex-direction: column; gap: 1.125rem; }

    .field-group { display: flex; flex-direction: column; gap: 0.375rem; }
    .field-label-row { display: flex; justify-content: space-between; align-items: center; }
    .field-label {
      font-size: 0.8125rem; font-weight: 700; color: #374151;
    }
    .input-wrapper { position: relative; }
    .field-input {
      width: 100%; padding: 0.6875rem 0.875rem; border: 1.5px solid #e5e7eb;
      border-radius: 10px; font-size: 0.9375rem; font-family: inherit;
      color: #111827; background: #f9fafb; box-sizing: border-box;
      transition: all 150ms ease;
      &:focus { outline: none; border-color: #4f46e5; background: white; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
      &::placeholder { color: #c0c5ce; }
    }
    .input-eye {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #9ca3af; padding: 0.25rem;
      display: flex; align-items: center;
      &:hover { color: #4f46e5; }
    }

    .btn-submit {
      margin-top: 0.5rem;
      width: 100%; padding: 0.8125rem;
      background: linear-gradient(135deg, #4f46e5, #6366f1); color: white;
      border: none; border-radius: 10px; font-size: 0.9375rem; font-weight: 700;
      font-family: inherit; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      box-shadow: 0 4px 14px rgba(79,70,229,0.35);
      transition: all 180ms ease;
      &:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(79,70,229,0.45); }
      &:disabled { opacity: 0.7; cursor: not-allowed; }
    }
    .spinner {
      width: 16px; height: 16px; border: 2.5px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .auth-footer { margin-top: 1.5rem; text-align: center; font-size: 0.875rem; color: #6b7280; }
    .auth-link { color: #4f46e5; font-weight: 700; text-decoration: none; &:hover { color: #3730a3; } }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  loading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly snackBar: MatSnackBar,
  ) {}

  submit(): void {
    if (!this.email || !this.password) return;
    this.loading = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => {
        this.loading = false;
        this.snackBar.open('Invalid email or password', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
