import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PipelineService } from '../../core/services/pipeline.service';
import { PipelineFailureInsightCardComponent } from '../../shared/pipeline-failure-insight-card/pipeline-failure-insight-card.component';
import { PrShowcaseComponent } from '../../shared/pr-showcase/pr-showcase.component';
import { ErrorLogViewerComponent } from '../../shared/error-log-viewer/error-log-viewer.component';
import type { PipelineDetails } from '../../core/models/pipeline.model';

@Component({
  selector: 'app-pipeline-details',
  standalone: true,
  imports: [
    RouterLink,
    MatSnackBarModule,
    PipelineFailureInsightCardComponent,
    PrShowcaseComponent,
    ErrorLogViewerComponent,
  ],
  template: `
<!-- Breadcrumb -->
<nav class="breadcrumb">
  <a routerLink="/" class="bc-link">Dashboard</a>
  <span class="bc-sep">›</span>
  <span class="bc-current">{{ failure()?.pipelineName || 'Pipeline Details' }}</span>
</nav>

@if (loading()) {
  <div class="loading-area">
    <div class="skeleton-block" style="height:220px;margin-bottom:1rem"></div>
    <div class="skeleton-block" style="height:120px;margin-bottom:1rem"></div>
    <div class="skeleton-block" style="height:80px"></div>
  </div>
} @else if (failure()) {

  <!-- Page header -->
  <div class="page-header">
    <div>
      <p class="page-eyebrow">Pipeline Analysis</p>
      <h1 class="page-title">{{ failure()!.pipelineName }}</h1>
      @if (failure()!.repoOwner && failure()!.repoName) {
        <p class="page-meta">{{ failure()!.repoOwner }}/{{ failure()!.repoName }}</p>
      }
    </div>
    <div class="page-header-badges">
      @if (failure()!.severity) {
        <span class="sev-badge" [class]="'sev-' + failure()!.severity!.toLowerCase()">
          {{ severityIcon(failure()!.severity) }} {{ failure()!.severity!.toUpperCase() }}
        </span>
      }
      <span class="status-badge">{{ failure()!.status }}</span>
      @if (failure()!.prCommentPosted && failure()!.sourcePrUrl) {
        <a [href]="failure()!.sourcePrUrl" target="_blank" rel="noopener noreferrer"
           class="comment-badge" title="AI analysis comment posted on PR #{{ failure()!.sourcePrNumber }}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
          Commented on PR #{{ failure()!.sourcePrNumber }}
        </a>
      }
    </div>
  </div>

  <!-- Insight card + PR + log -->
  <app-pipeline-failure-insight-card [failure]="failure()" />

  @if (failure()!.createdPullRequest) {
    <app-pr-showcase [pr]="failure()!.createdPullRequest" />
  }

  <!-- Error log expand -->
  <div class="expand-panel">
    <button class="expand-header" (click)="logOpen = !logOpen">
      <span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" style="display:inline;margin-right:0.4rem;vertical-align:-2px" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        Full Error Log
      </span>
      <svg class="expand-chevron" [class.open]="logOpen" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    @if (logOpen) {
      <div class="expand-body">
        <app-error-log-viewer [log]="failure()!.errorLog" />
      </div>
    }
  </div>

  <!-- Generate PR button -->
  @if (!failure()!.createdPullRequest && failure()!.repoOwner && failure()!.repoName) {
    <div class="actions-row">
      <button class="btn btn-primary" (click)="createPr()" [disabled]="creatingPr()">
        @if (creatingPr()) {
          <span class="btn-spinner"></span> Creating PR…
        } @else {
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7M6 9v12"/></svg>
          Generate Fix PR
        }
      </button>
      <p class="actions-hint">AI will create a pull request with the suggested fix (confidence: {{ failure()!.confidence }}%)</p>
    </div>
  }

} @else {
  <div class="not-found">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <h3>Pipeline not found</h3>
    <a routerLink="/" class="btn btn-ghost">← Back to Dashboard</a>
  </div>
}
  `,
  styles: [`
    /* Breadcrumb */
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; font-size: 0.875rem; }
    .bc-link { color: var(--text-muted); text-decoration: none; transition: color var(--transition); &:hover { color: var(--primary); } }
    .bc-sep { color: var(--text-faint); }
    .bc-current { color: var(--text); font-weight: 500; }

    /* Loading */
    .loading-area { display: flex; flex-direction: column; }
    .skeleton-block {
      border-radius: var(--radius-lg);
      background: linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Page header */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .page-eyebrow { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--primary); margin: 0 0 0.25rem; }
    .page-title { font-size: 1.625rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.25rem; color: var(--text); }
    .page-meta { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
    .page-header-badges { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; padding-top: 0.375rem; }

    /* Badges */
    .sev-badge {
      display: inline-flex; align-items: center; gap: 0.2rem;
      padding: 0.25rem 0.75rem; border-radius: 9999px;
      font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.05em; white-space: nowrap;
    }
    .sev-high   { background: var(--danger-muted);  color: var(--danger);  border: 1px solid var(--danger-border); }
    .sev-medium { background: var(--warning-muted); color: var(--warning); border: 1px solid var(--warning-border); }
    .sev-low    { background: var(--success-muted); color: var(--success); border: 1px solid var(--success-border); }
    .status-badge {
      padding: 0.25rem 0.75rem; border-radius: 9999px;
      font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
      background: var(--danger-muted); color: var(--danger); border: 1px solid var(--danger-border);
    }

    /* Comment badge */
    .comment-badge {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.03em; white-space: nowrap;
      background: #ede9fe; color: #6d28d9;
      border: 1px solid #c4b5fd;
      text-decoration: none;
      transition: background var(--transition);
      &:hover { background: #ddd6fe; }
    }

    /* Expand panel */
    .expand-panel { border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; margin-bottom: 1rem; }
    .expand-header {
      width: 100%; text-align: left;
      padding: 0.875rem 1.25rem;
      background: var(--bg-subtle);
      border: none; cursor: pointer;
      font-size: 0.875rem; font-weight: 600;
      color: var(--text); font-family: inherit;
      display: flex; justify-content: space-between; align-items: center;
      transition: background var(--transition);
      &:hover { background: var(--border-light); }
    }
    .expand-chevron { transition: transform var(--transition-slow); color: var(--text-muted); flex-shrink: 0; }
    .expand-chevron.open { transform: rotate(180deg); }
    .expand-body { padding: 1.25rem; }

    /* Actions row */
    .actions-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-top: 0.5rem; }
    .actions-hint { font-size: 0.8125rem; color: var(--text-muted); margin: 0; }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.5rem 1.25rem;
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
    .btn-spinner {
      display: inline-block; width: 12px; height: 12px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff;
      border-radius: 50%; animation: spin 0.65s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Not found */
    .not-found { text-align: center; padding: 5rem 2rem; color: var(--text-muted); }
    .not-found svg { margin: 0 auto 1rem; display: block; opacity: 0.3; }
    .not-found h3 { font-size: 1.125rem; font-weight: 700; color: var(--text); margin: 0 0 1.5rem; }
  `]
})
export class PipelineDetailsComponent implements OnInit {
  failure = signal<PipelineDetails | null>(null);
  loading = signal(true);
  creatingPr = signal(false);
  logOpen = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly pipelineService: PipelineService,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.loading.set(false); return; }
    this.pipelineService.getPipelineDetails(id).subscribe({
      next: (d) => { this.failure.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  createPr(): void {
    const f = this.failure();
    if (!f?.id || !f.repoOwner || !f.repoName) return;
    this.creatingPr.set(true);
    this.pipelineService.createPR({ pipelineFailureId: f.id, repoOwner: f.repoOwner, repoName: f.repoName }).subscribe({
      next: () => {
        this.creatingPr.set(false);
        this.snackBar.open('✓ Pull request created!', 'Close', { duration: 4000 });
        this.pipelineService.getPipelineDetails(f.id).subscribe({ next: (u) => this.failure.set(u) });
      },
      error: (err) => {
        this.creatingPr.set(false);
        this.snackBar.open(err?.error?.title || 'Failed to create PR.', 'Close', { duration: 5000 });
      },
    });
  }

  severityIcon(s?: string): string {
    switch ((s || '').toLowerCase()) {
      case 'high': return '🔴'; case 'medium': return '🟡'; case 'low': return '🟢'; default: return '';
    }
  }
}
