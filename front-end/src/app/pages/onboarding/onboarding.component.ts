import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

interface OnboardingStatus {
  hasSource: boolean;
  hasRepo: boolean;
  hasFailure: boolean;
  isComplete: boolean;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="onboarding-shell">

  <!-- Logo -->
  <div class="onboarding-logo">
    <svg width="32" height="32" viewBox="0 0 30 30" fill="none">
      <rect width="30" height="30" rx="8" fill="url(#lgob)"/>
      <path d="M9 21l6-12 6 12M11.5 17h7" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <defs><linearGradient id="lgob" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/>
      </linearGradient></defs>
    </svg>
    <span class="logo-text">FixMyBuild <span class="grad">AI</span></span>
  </div>

  <!-- Header -->
  <div class="onboarding-header">
    @if (status?.isComplete) {
      <div class="complete-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h1 class="onboarding-title">You're all set!</h1>
      <p class="onboarding-subtitle">FixMyBuild is monitoring your pipelines and analyzing failures automatically.</p>
    } @else {
      <h1 class="onboarding-title">Welcome, {{ firstName }}!</h1>
      <p class="onboarding-subtitle">Complete these steps to start catching and fixing pipeline failures automatically.</p>
    }

    <!-- Progress bar -->
    <div class="progress-track">
      <div class="progress-fill" [style.width.%]="progressPct"></div>
    </div>
    <span class="progress-label">{{ completedCount }} of 3 steps complete</span>
  </div>

  <!-- Steps -->
  <div class="steps-list">

    <!-- Step 1: Connect a source -->
    <div class="step-card" [class.done]="status?.hasSource">
      <div class="step-number" [class.done]="status?.hasSource">
        @if (status?.hasSource) {
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        } @else { 1 }
      </div>
      <div class="step-body">
        <div class="step-title">Connect a pipeline source</div>
        <div class="step-desc">Link your GitHub, GitLab, or Azure DevOps account so FixMyBuild can monitor your CI/CD runs.</div>
        @if (!status?.hasSource) {
          <a routerLink="/settings" [queryParams]="{tab:'sources'}" class="step-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            Connect Source
          </a>
        } @else {
          <span class="step-done-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Connected
          </span>
        }
      </div>
      <div class="step-providers">
        <span class="provider-pip github">GitHub</span>
        <span class="provider-pip gitlab">GitLab</span>
        <span class="provider-pip azure">Azure DevOps</span>
      </div>
    </div>

    <!-- Step 2: Add a repository -->
    <div class="step-card" [class.done]="status?.hasRepo" [class.locked]="!status?.hasSource">
      <div class="step-number" [class.done]="status?.hasRepo">
        @if (status?.hasRepo) {
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        } @else { 2 }
      </div>
      <div class="step-body">
        <div class="step-title">Add a repository to monitor</div>
        <div class="step-desc">Choose which repos FixMyBuild should watch. You can add as many as you need.</div>
        @if (status?.hasSource && !status?.hasRepo) {
          <a routerLink="/settings" [queryParams]="{tab:'sources'}" class="step-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            Add Repository
          </a>
        } @else if (!status?.hasSource) {
          <span class="step-locked-label">Complete step 1 first</span>
        } @else {
          <span class="step-done-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Added
          </span>
        }
      </div>
    </div>

    <!-- Step 3: Receive your first failure -->
    <div class="step-card" [class.done]="status?.hasFailure" [class.locked]="!status?.hasRepo">
      <div class="step-number" [class.done]="status?.hasFailure">
        @if (status?.hasFailure) {
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        } @else { 3 }
      </div>
      <div class="step-body">
        <div class="step-title">Receive your first failure analysis</div>
        <div class="step-desc">Trigger a failing pipeline run — or use our ingest API — and FixMyBuild will analyze it with AI automatically.</div>
        @if (status?.hasRepo && !status?.hasFailure) {
          <div class="step-actions">
            <a routerLink="/settings" [queryParams]="{tab:'api-keys'}" class="step-btn">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              Get API Key
            </a>
            <button class="step-btn step-btn-ghost" (click)="seedDemo()" [disabled]="seeding">
              @if (seeding) { <span class="spinner-xs"></span> }
              Load demo data
            </button>
          </div>
        } @else if (!status?.hasRepo) {
          <span class="step-locked-label">Complete step 2 first</span>
        } @else {
          <span class="step-done-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            Received
          </span>
        }
      </div>
    </div>

  </div>

  <!-- CTA -->
  @if (status?.isComplete) {
    <a routerLink="/" class="goto-dashboard-btn">
      Go to Dashboard
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    </a>
  } @else {
    <a routerLink="/" class="skip-link">Skip for now — go to dashboard</a>
  }

</div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #f8fafc; }

    .onboarding-shell {
      max-width: 640px; margin: 0 auto;
      padding: 3rem 1.5rem 4rem;
      display: flex; flex-direction: column; align-items: center;
    }

    /* Logo */
    .onboarding-logo {
      display: flex; align-items: center; gap: 0.625rem;
      margin-bottom: 2.5rem;
    }
    .logo-text {
      font-size: 1.0625rem; font-weight: 800; color: #111827; letter-spacing: -0.02em;
    }
    .grad {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    /* Header */
    .onboarding-header {
      text-align: center; width: 100%; margin-bottom: 2rem;
    }
    .complete-icon {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white; display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem; box-shadow: 0 8px 24px rgba(34,197,94,0.3);
    }
    .onboarding-title {
      font-size: 1.75rem; font-weight: 800; color: #111827;
      letter-spacing: -0.03em; margin: 0 0 0.5rem;
    }
    .onboarding-subtitle {
      font-size: 0.9375rem; color: #6b7280; margin: 0 0 1.5rem; line-height: 1.6;
    }
    .progress-track {
      height: 6px; background: #e5e7eb; border-radius: 99px;
      overflow: hidden; margin-bottom: 0.5rem;
    }
    .progress-fill {
      height: 100%; background: linear-gradient(90deg, #6366f1, #a855f7);
      border-radius: 99px; transition: width 500ms ease;
    }
    .progress-label {
      font-size: 0.75rem; font-weight: 600; color: #9ca3af;
    }

    /* Steps */
    .steps-list {
      width: 100%; display: flex; flex-direction: column; gap: 0.875rem;
      margin-bottom: 2rem;
    }
    .step-card {
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 16px; padding: 1.25rem 1.375rem;
      display: flex; gap: 1rem; align-items: flex-start;
      transition: all 200ms ease;
      &.done { border-color: #bbf7d0; background: #f0fdf4; }
      &.locked { opacity: 0.55; pointer-events: none; }
      &:not(.done):not(.locked) { box-shadow: 0 4px 16px rgba(79,70,229,0.06); }
    }
    .step-number {
      width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.875rem; font-weight: 800;
      background: #f1f5f9; color: #6b7280;
      border: 2px solid #e2e8f0;
      transition: all 200ms ease;
      &.done {
        background: linear-gradient(135deg, #22c55e, #16a34a);
        color: white; border-color: transparent;
        box-shadow: 0 4px 12px rgba(34,197,94,0.3);
      }
    }
    .step-body { flex: 1; min-width: 0; }
    .step-title {
      font-size: 0.9375rem; font-weight: 700; color: #111827; margin-bottom: 0.375rem;
    }
    .step-desc {
      font-size: 0.8125rem; color: #6b7280; line-height: 1.5; margin-bottom: 0.875rem;
    }
    .step-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .step-btn {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.5rem 1rem; border-radius: 9px;
      font-size: 0.8125rem; font-weight: 600;
      background: linear-gradient(135deg, #4f46e5, #6366f1);
      color: white; border: none; cursor: pointer; font-family: inherit;
      text-decoration: none;
      transition: all 180ms ease;
      &:hover { box-shadow: 0 4px 16px rgba(79,70,229,0.3); transform: translateY(-1px); }
      &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    }
    .step-btn-ghost {
      background: white; color: #4f46e5;
      border: 1.5px solid #c7d2fe;
      &:hover { background: #eef2ff; box-shadow: none; transform: none; }
    }
    .step-done-label {
      display: inline-flex; align-items: center; gap: 0.25rem;
      font-size: 0.75rem; font-weight: 700; color: #16a34a;
    }
    .step-locked-label {
      font-size: 0.75rem; font-weight: 600; color: #9ca3af;
    }
    .step-providers {
      display: flex; gap: 0.375rem; margin-top: 0.5rem; flex-wrap: wrap;
    }
    .provider-pip {
      padding: 2px 8px; border-radius: 99px;
      font-size: 0.625rem; font-weight: 700; letter-spacing: 0.04em;
    }
    .provider-pip.github { background: #eef2ff; color: #4f46e5; }
    .provider-pip.gitlab { background: #fef3c7; color: #d97706; }
    .provider-pip.azure  { background: #eff6ff; color: #2563eb; }

    /* CTA */
    .goto-dashboard-btn {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 2rem; border-radius: 12px;
      font-size: 0.9375rem; font-weight: 700;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; text-decoration: none;
      box-shadow: 0 8px 24px rgba(79,70,229,0.3);
      transition: all 200ms ease;
      &:hover { box-shadow: 0 12px 32px rgba(79,70,229,0.4); transform: translateY(-2px); }
    }
    .skip-link {
      font-size: 0.8125rem; color: #9ca3af; text-decoration: none;
      &:hover { color: #6b7280; text-decoration: underline; }
    }

    /* Spinner */
    .spinner-xs {
      width: 10px; height: 10px;
      border: 2px solid rgba(79,70,229,0.2); border-top-color: #4f46e5;
      border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class OnboardingComponent implements OnInit {
  status: OnboardingStatus | null = null;
  seeding = false;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  get firstName(): string {
    return this.authService.currentUser()?.firstName ?? 'there';
  }

  get completedCount(): number {
    if (!this.status) return 0;
    return [this.status.hasSource, this.status.hasRepo, this.status.hasFailure]
      .filter(Boolean).length;
  }

  get progressPct(): number {
    return (this.completedCount / 3) * 100;
  }

  ngOnInit(): void {
    this.loadStatus();
  }

  loadStatus(): void {
    this.http.get<OnboardingStatus>(`${environment.apiUrl}/api/onboarding/status`).subscribe({
      next: (s) => { this.status = s; },
      error: () => { /* non-critical — show partial UI */ },
    });
  }

  seedDemo(): void {
    this.seeding = true;
    this.http.post(`${environment.apiUrl}/api/pipelines/seed`, {}).subscribe({
      next: () => {
        this.seeding = false;
        this.loadStatus();
      },
      error: () => { this.seeding = false; this.loadStatus(); },
    });
  }
}
