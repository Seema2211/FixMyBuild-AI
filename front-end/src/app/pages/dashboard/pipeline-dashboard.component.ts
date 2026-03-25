import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PipelineService } from '../../core/services/pipeline.service';
import { AuthService } from '../../core/services/auth.service';
import { SseService } from '../../core/services/sse.service';
import { AnalyzeDialogComponent } from '../../shared/analyze-dialog/analyze-dialog.component';
import { DashboardAnalyticsComponent } from '../../shared/dashboard-analytics/dashboard-analytics.component';
import type { PipelineListItem, PipelineStats, PipelineAnalytics } from '../../core/models/pipeline.model';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

interface OnboardingStatus { hasSource: boolean; hasRepo: boolean; hasFailure: boolean; isComplete: boolean; }

@Component({
  selector: 'app-pipeline-dashboard',
  standalone: true,
  imports: [RouterLink, FormsModule, MatDialogModule, MatSnackBarModule, DashboardAnalyticsComponent],
  template: `
<!-- ── EMAIL VERIFICATION BANNER ── -->
@if (authService.currentUser() && !authService.currentUser()!.emailVerified) {
  <div class="verify-banner">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    <span>Please verify your email address to unlock all features.</span>
    <button class="verify-btn" (click)="resendVerification()" [disabled]="resendingVerification">
      {{ resendingVerification ? 'Sending…' : 'Resend email' }}
    </button>
  </div>
}

<!-- ── ONBOARDING BANNER ── -->
@if (onboarding() && !onboarding()!.isComplete) {
  <div class="onboarding-banner">
    <div class="ob-left">
      <div class="ob-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <div class="ob-text">
        <span class="ob-title">Finish setting up FixMyBuild</span>
        <span class="ob-steps">{{ onboardingStepsLeft() }} step{{ onboardingStepsLeft() !== 1 ? 's' : '' }} remaining</span>
      </div>
    </div>
    <div class="ob-progress-wrap">
      <div class="ob-pips">
        <div class="ob-pip" [class.done]="onboarding()!.hasSource" title="Connect a source"></div>
        <div class="ob-pip" [class.done]="onboarding()!.hasRepo" title="Add a repository"></div>
        <div class="ob-pip" [class.done]="onboarding()!.hasFailure" title="First failure analyzed"></div>
      </div>
    </div>
    <a routerLink="/onboarding" class="ob-btn">Continue Setup</a>
  </div>
}

<!-- ── STATS ROW ── -->
@if (stats()) {
  <div class="stats-grid">
    <div class="stat-card stat-total">
      <div class="stat-icon-wrap stat-icon-blue">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">{{ stats()!.totalFailures }}</div>
        <div class="stat-label">Total Failures</div>
      </div>
    </div>
    <div class="stat-card stat-high">
      <div class="stat-icon-wrap stat-icon-red">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">{{ stats()!.highSeverityCount }}</div>
        <div class="stat-label">High Severity</div>
      </div>
    </div>
    <div class="stat-card stat-conf">
      <div class="stat-icon-wrap stat-icon-green">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">{{ stats()!.avgConfidence }}%</div>
        <div class="stat-label">Avg Confidence</div>
      </div>
    </div>
    <div class="stat-card stat-pr">
      <div class="stat-icon-wrap stat-icon-violet">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
          <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7M6 9v12"/>
        </svg>
      </div>
      <div>
        <div class="stat-value">{{ stats()!.prsCreated }}</div>
        <div class="stat-label">PRs Created</div>
      </div>
    </div>
  </div>
}

<!-- ── ANALYTICS (Impact + Charts) ── -->
<app-dashboard-analytics [data]="analytics()" />

<!-- ── MAIN CARD ── -->
<div class="main-card">

  <!-- Card header -->
  <div class="card-header">
    <div>
      <h1 class="card-title">Pipeline Failures</h1>
      <p class="card-subtitle">Failed GitHub Actions runs with AI root-cause analysis</p>
    </div>
    <div class="header-actions">
      <button class="btn btn-ghost" (click)="seedDemo()" [disabled]="seeding()">
        @if (seeding()) {
          <span class="btn-spinner"></span> Loading…
        } @else {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
          Demo Data
        }
      </button>
      <button class="btn btn-primary" (click)="openAnalyzeDialog()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Analyze Run
      </button>
    </div>
  </div>

  <!-- Filter bar -->
  <div class="filter-bar">
    <div class="search-wrap">
      <svg class="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input
        class="search-input"
        type="text"
        [(ngModel)]="searchTerm"
        (ngModelChange)="onSearchChange()"
        placeholder="Search pipeline, root cause, repo…"
      />
      @if (searchTerm) {
        <button class="search-clear" (click)="clearSearch()" aria-label="Clear search">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      }
    </div>
    <div class="select-wrap">
      <select class="filter-select" [(ngModel)]="severityFilter" (ngModelChange)="onFilterChange()">
        <option value="">All Severity</option>
        <option value="high">🔴 High</option>
        <option value="medium">🟡 Medium</option>
        <option value="low">🟢 Low</option>
      </select>
    </div>
    <span class="filter-count">{{ total() }} result{{ total() !== 1 ? 's' : '' }}</span>
  </div>

  <!-- Table -->
  @if (loading()) {
    <div class="loading-area">
      @for (i of [1,2,3,4,5]; track i) { <div class="skeleton-row"></div> }
    </div>
  } @else if (items().length === 0) {
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="empty-icon" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="11" y1="16" x2="11.01" y2="16"/></svg>
      <h3 class="empty-title">No pipeline failures found</h3>
      <p class="empty-body">Click <strong>Demo Data</strong> to load sample failures or <strong>Analyze Run</strong> to inspect a live GitHub Actions run.</p>
    </div>
  } @else {
    <div class="table-wrap">
      <table class="failures-table">
        <thead>
          <tr>
            <th>Pipeline</th>
            <th>Stage</th>
            <th>Severity</th>
            <th>Root Cause</th>
            <th>Confidence</th>
            <th>PR</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (row of items(); track row.id) {
            <tr class="table-row">
              <td>
                <div class="pipeline-name">{{ row.pipelineName }}</div>
                @if (row.repoOwner && row.repoName) {
                  <div class="repo-label">{{ row.repoOwner }}/{{ row.repoName }}</div>
                }
              </td>
              <td class="stage-cell">{{ row.failedStage || '—' }}</td>
              <td>
                <span class="sev-badge" [class]="'sev-' + (row.severity || 'medium').toLowerCase()">
                  {{ severityIcon(row.severity) }} {{ (row.severity || '—').toUpperCase() }}
                </span>
              </td>
              <td class="root-cause-cell" [title]="row.rootCause">{{ row.rootCause || '—' }}</td>
              <td>
                <div class="conf-wrap">
                  <div class="conf-bar-bg">
                    <div class="conf-bar-fill" [style.width.%]="row.confidence" [class]="confClass(row.confidence)"></div>
                  </div>
                  <span class="conf-pct">{{ row.confidence }}%</span>
                </div>
              </td>
              <td>
                @if (row.createdPullRequest?.htmlUrl) {
                  <a [href]="row.createdPullRequest!.htmlUrl" target="_blank" rel="noopener noreferrer" class="pr-link">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7M6 9v12"/></svg>
                    #{{ row.createdPullRequest!.prNumber || 'PR' }}
                  </a>
                } @else {
                  <span class="no-val">—</span>
                }
                @if (row.prCommentPosted && row.sourcePrUrl) {
                  <a [href]="row.sourcePrUrl" target="_blank" rel="noopener noreferrer" class="comment-badge" title="AI comment posted on PR #{{ row.sourcePrNumber }}">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    #{{ row.sourcePrNumber }}
                  </a>
                }
              </td>
              <td>
                <a [routerLink]="['/pipelines', row.id]" class="btn btn-sm btn-primary">View Fix</a>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    @if (total() > pageSize) {
      <div class="pagination">
        <button class="page-btn" [disabled]="currentPage === 1" (click)="goPage(currentPage - 1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        @for (p of pageNumbers(); track p) {
          <button class="page-btn" [class.page-active]="p === currentPage" (click)="goPage(p)">{{ p }}</button>
        }
        <button class="page-btn" [disabled]="currentPage === totalPages()" (click)="goPage(currentPage + 1)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <span class="page-info">{{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, total()) }} of {{ total() }}</span>
      </div>
    }
  }

</div>
  `,
  styles: [`
    /* ── Onboarding Banner ── */
    .onboarding-banner {
      display: flex; align-items: center; gap: 1rem;
      background: linear-gradient(135deg, #eef2ff 0%, #faf5ff 100%);
      border: 1.5px solid #c7d2fe; border-radius: 14px;
      padding: 0.875rem 1.25rem; margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .ob-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
    .ob-icon {
      width: 36px; height: 36px; border-radius: 9px;
      background: #4f46e5; color: white; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .ob-text { display: flex; flex-direction: column; }
    .ob-title { font-size: 0.875rem; font-weight: 700; color: #111827; }
    .ob-steps { font-size: 0.75rem; color: #6b7280; margin-top: 1px; }
    .ob-progress-wrap { display: flex; align-items: center; }
    .ob-pips { display: flex; gap: 6px; }
    .ob-pip {
      width: 28px; height: 6px; border-radius: 99px;
      background: #c7d2fe; transition: background 300ms ease;
      &.done { background: #4f46e5; }
    }
    .ob-btn {
      display: inline-flex; align-items: center;
      padding: 0.5rem 1rem; border-radius: 8px;
      font-size: 0.8125rem; font-weight: 700;
      background: #4f46e5; color: white; text-decoration: none;
      transition: all 150ms ease;
      &:hover { background: #4338ca; box-shadow: 0 4px 12px rgba(79,70,229,0.3); }
    }

    /* Email Verification Banner */
    .verify-banner {
      display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
      background: #fefce8; border: 1.5px solid #fde047; border-radius: 12px;
      padding: 0.875rem 1.125rem; margin-bottom: 1rem;
      font-size: 0.875rem; color: #713f12;
      svg { flex-shrink: 0; color: #ca8a04; }
      span { flex: 1; }
    }
    .verify-btn {
      padding: 0.375rem 0.875rem; border-radius: 7px;
      background: #ca8a04; color: white; border: none;
      font-size: 0.75rem; font-weight: 700; cursor: pointer; font-family: inherit;
      transition: all 150ms ease; white-space: nowrap;
      &:hover:not(:disabled) { background: #a16207; }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    /* Stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.75rem; } }

    .stat-card {
      background: #fff;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow-xs);
      display: flex;
      align-items: center;
      gap: 1rem;
      position: relative;
      overflow: hidden;
      transition: box-shadow var(--transition), transform var(--transition);
      cursor: default;
      &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
      &:hover { box-shadow: var(--shadow-sm); transform: translateY(-2px); }
    }
    .stat-total::before { background: #4f46e5; }
    .stat-high::before  { background: #dc2626; }
    .stat-conf::before  { background: #059669; }
    .stat-pr::before    { background: #7c3aed; }

    .stat-icon-wrap {
      width: 38px; height: 38px;
      border-radius: 7px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon-blue   { background: #eef2ff; color: #4f46e5; }
    .stat-icon-red    { background: #fef2f2; color: #dc2626; }
    .stat-icon-green  { background: #ecfdf5; color: #059669; }
    .stat-icon-violet { background: #f5f3ff; color: #7c3aed; }

    .stat-value { font-size: 2rem; font-weight: 800; letter-spacing: -0.04em; line-height: 1.2; color: var(--text); }
    .stat-label { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.15rem; }

    /* Main card */
    .main-card {
      background: #fff;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1.5rem 1.5rem 0;
    }

    .card-title { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 0.2rem; color: var(--text); }
    .card-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

    .header-actions { display: flex; gap: 0.625rem; flex-shrink: 0; }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem; font-weight: 600;
      border: none; cursor: pointer;
      transition: all var(--transition);
      white-space: nowrap; text-decoration: none;
      &:disabled { opacity: 0.55; cursor: not-allowed; transform: none !important; }
    }
    .btn-primary {
      background: var(--primary); color: #fff;
      box-shadow: 0 1px 3px rgba(79,70,229,0.2);
      &:hover:not(:disabled) { background: var(--primary-dark); box-shadow: var(--shadow-primary); transform: translateY(-1px); }
    }
    .btn-ghost {
      background: var(--bg-subtle); color: var(--text);
      border: 1px solid var(--border);
      &:hover:not(:disabled) { background: var(--border); }
    }
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.75rem; }
    .btn-spinner {
      display: inline-block; width: 12px; height: 12px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.65s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Filters */
    .filter-bar {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1.25rem 1.5rem 0;
      flex-wrap: wrap;
    }
    .search-wrap { position: relative; flex: 1; min-width: 200px; }
    .search-icon {
      position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
      color: var(--text-faint); pointer-events: none;
    }
    .search-input {
      width: 100%;
      padding: 0.5625rem 2.25rem 0.5625rem 2.375rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-family: inherit;
      background: #fff;
      color: var(--text);
      outline: none;
      transition: border-color var(--transition), box-shadow var(--transition);
      &::placeholder { color: var(--text-faint); }
      &:focus { border-color: var(--primary-light); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    }
    .search-clear {
      position: absolute; right: 0.625rem; top: 50%; transform: translateY(-50%);
      width: 20px; height: 20px;
      display: flex; align-items: center; justify-content: center;
      border: none; background: var(--border-light);
      border-radius: 50%; cursor: pointer; color: var(--text-muted);
      &:hover { background: var(--border); }
    }
    .select-wrap { position: relative; }
    .filter-select {
      padding: 0.5625rem 2.25rem 0.5625rem 0.875rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.875rem;
      font-family: inherit;
      background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 0.75rem center;
      background-size: 12px;
      appearance: none;
      color: var(--text);
      outline: none;
      cursor: pointer;
      transition: border-color var(--transition);
      &:focus { border-color: var(--primary-light); }
    }
    .filter-count {
      font-size: 0.8125rem; color: var(--text-muted);
      padding: 0.5rem 0.75rem;
      background: var(--bg-subtle);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      white-space: nowrap;
    }

    /* Loading skeleton */
    .loading-area { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.625rem; }
    .skeleton-row {
      height: 52px; border-radius: var(--radius-sm);
      background: linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Empty state */
    .empty-state { text-align: center; padding: 4rem 2rem; color: var(--text-muted); }
    .empty-icon { margin: 0 auto 1rem; opacity: 0.3; display: block; color: var(--text-faint); }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: var(--text); margin: 0 0 0.5rem; }
    .empty-body { font-size: 0.9375rem; color: var(--text-muted); max-width: 380px; margin: 0 auto; line-height: 1.6; }

    /* Table */
    .table-wrap { overflow-x: auto; margin-top: 1.25rem; }
    .failures-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    .failures-table thead tr {
      background: var(--bg-subtle);
      border-bottom: 1px solid var(--border);
    }
    .failures-table th {
      padding: 0.75rem 1rem;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-muted);
      text-align: left;
      white-space: nowrap;
    }
    .table-row {
      border-bottom: 1px solid var(--border-light);
      transition: background var(--transition);
      &:last-child { border-bottom: none; }
      &:hover { background: #f5f4ff; }
    }
    .failures-table td { padding: 1rem; vertical-align: middle; color: var(--text); }

    .pipeline-name { font-weight: 600; }
    .repo-label { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .stage-cell { color: var(--text-muted); font-size: 0.8125rem; }
    .root-cause-cell { max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .no-val { color: var(--text-faint); }

    /* Severity badge */
    .sev-badge {
      display: inline-flex; align-items: center; gap: 0.2rem;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      font-size: 0.6875rem; font-weight: 700;
      letter-spacing: 0.05em;
      white-space: nowrap;
    }
    .sev-high   { background: var(--danger-muted);  color: var(--danger);  border: 1px solid var(--danger-border); }
    .sev-medium { background: var(--warning-muted); color: var(--warning); border: 1px solid var(--warning-border); }
    .sev-low    { background: var(--success-muted); color: var(--success); border: 1px solid var(--success-border); }

    /* Confidence */
    .conf-wrap { display: flex; align-items: center; gap: 0.5rem; min-width: 110px; }
    .conf-bar-bg { flex: 1; height: 4px; background: var(--border); border-radius: 9999px; overflow: hidden; }
    .conf-bar-fill { height: 100%; border-radius: 9999px; transition: width 0.5s cubic-bezier(0.4,0,0.2,1); }
    .conf-high   { background: linear-gradient(90deg, #4f46e5, #818cf8); }
    .conf-medium { background: linear-gradient(90deg, #d97706, #fbbf24); }
    .conf-low    { background: linear-gradient(90deg, #dc2626, #f87171); }
    .conf-pct { font-size: 0.8125rem; font-weight: 700; width: 34px; text-align: right; color: var(--text); }

    /* PR link */
    .pr-link {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.8125rem; font-weight: 600;
      color: #7c3aed; text-decoration: none;
      &:hover { text-decoration: underline; }
    }

    /* PR comment badge */
    .comment-badge {
      display: inline-flex; align-items: center; gap: 0.25rem;
      margin-top: 0.25rem;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      font-size: 0.75rem; font-weight: 600;
      background: #ede9fe; color: #6d28d9;
      border: 1px solid #c4b5fd;
      text-decoration: none;
      transition: background var(--transition);
      &:hover { background: #ddd6fe; }
    }

    /* Pagination */
    .pagination {
      display: flex; align-items: center; gap: 0.375rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-light);
      flex-wrap: wrap;
    }
    .page-btn {
      min-width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border);
      border-radius: var(--radius-xs);
      background: #fff;
      font-size: 0.8125rem; font-weight: 500;
      color: var(--text); cursor: pointer;
      padding: 0 0.5rem;
      transition: all var(--transition);
      &:hover:not(:disabled) { background: var(--primary-bg); border-color: var(--primary-light); color: var(--primary); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
    }
    .page-active { background: var(--primary) !important; color: #fff !important; border-color: var(--primary) !important; }
    .page-info { font-size: 0.8125rem; color: var(--text-muted); margin-left: 0.5rem; }
  `]
})
export class PipelineDashboardComponent implements OnInit, OnDestroy {
  Math = Math;
  loading = signal(true);
  seeding = signal(false);
  stats = signal<PipelineStats | null>(null);
  analytics = signal<PipelineAnalytics | null>(null);
  items = signal<PipelineListItem[]>([]);
  total = signal(0);
  onboarding = signal<OnboardingStatus | null>(null);
  resendingVerification = false;

  searchTerm = '';
  severityFilter = '';
  currentPage = 1;
  pageSize = 20;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private sseSub: Subscription | null = null;

  constructor(
    private readonly pipelineService: PipelineService,
    readonly authService: AuthService,
    private readonly http: HttpClient,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
    private readonly sseService: SseService,
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadAnalytics();
    this.loadPipelines();
    this.loadOnboardingStatus();
    this.sseSub = this.sseService.events$.subscribe(event => {
      if (event.type === 'failure.created' && this.currentPage === 1) {
        // Refresh list to show the new failure at top
        this.loadPipelines();
        this.loadStats();
      }
    });
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
  }

  loadOnboardingStatus(): void {
    this.http.get<OnboardingStatus>(`${environment.apiUrl}/api/onboarding/status`).subscribe({
      next: (s) => this.onboarding.set(s),
      error: () => {},
    });
  }

  resendVerification(): void {
    this.resendingVerification = true;
    this.http.post(`${environment.apiUrl}/api/auth/resend-verification`, {}).subscribe({
      next: () => {
        this.resendingVerification = false;
        this.snackBar.open('Verification email sent! Check your inbox.', 'OK', { duration: 5000 });
      },
      error: (err) => {
        this.resendingVerification = false;
        this.snackBar.open(err?.error?.message ?? 'Failed to send verification email.', 'Dismiss', { duration: 4000 });
      },
    });
  }

  onboardingStepsLeft(): number {
    const s = this.onboarding();
    if (!s) return 3;
    return [s.hasSource, s.hasRepo, s.hasFailure].filter(v => !v).length;
  }

  loadStats(): void {
    this.pipelineService.getStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {},
    });
  }

  loadAnalytics(): void {
    this.pipelineService.getAnalytics().subscribe({
      next: (a) => this.analytics.set(a),
      error: () => {},
    });
  }

  loadPipelines(): void {
    this.loading.set(true);
    this.pipelineService.getPipelines({
      search: this.searchTerm || undefined,
      severity: this.severityFilter || undefined,
      page: this.currentPage,
      pageSize: this.pageSize,
    }).subscribe({
      next: (page) => {
        this.items.set(page.items);
        this.total.set(page.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onSearchChange(): void {
    this.currentPage = 1;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.loadPipelines(), 300);
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPipelines();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  goPage(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage = page;
    this.loadPipelines();
  }

  totalPages(): number { return Math.ceil(this.total() / this.pageSize); }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage;
    const pages: number[] = [];
    const range = 2;
    for (let i = Math.max(1, current - range); i <= Math.min(total, current + range); i++) pages.push(i);
    return pages;
  }

  severityIcon(s?: string): string {
    switch ((s || '').toLowerCase()) {
      case 'high':   return '🔴';
      case 'medium': return '🟡';
      case 'low':    return '🟢';
      default: return '';
    }
  }

  confClass(conf: number): string {
    if (conf >= 70) return 'conf-high';
    if (conf >= 40) return 'conf-medium';
    return 'conf-low';
  }

  openAnalyzeDialog(): void {
    const ref = this.dialog.open(AnalyzeDialogComponent, {
      width: '540px',
      panelClass: 'custom-dialog-panel',
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.loading.set(true);
      this.pipelineService.analyze(result).subscribe({
        next: () => {
          this.snackBar.open('✓ Analysis complete!', 'Close', { duration: 3000 });
          this.loadStats();
          this.loadAnalytics();
          this.loadPipelines();
        },
        error: (err) => {
          this.loading.set(false);
          this.snackBar.open(err?.error?.title || 'Analysis failed.', 'Close', { duration: 5000 });
        },
      });
    });
  }

  seedDemo(): void {
    this.seeding.set(true);
    this.pipelineService.seedDemo().subscribe({
      next: () => {
        this.seeding.set(false);
        this.snackBar.open('✓ Demo data loaded!', 'Close', { duration: 3000 });
        this.loadStats();
        this.loadAnalytics();
        this.loadPipelines();
      },
      error: () => {
        this.seeding.set(false);
        this.snackBar.open('Already seeded — refreshing data.', 'Close', { duration: 3000 });
        this.loadStats();
        this.loadAnalytics();
        this.loadPipelines();
      },
    });
  }
}
