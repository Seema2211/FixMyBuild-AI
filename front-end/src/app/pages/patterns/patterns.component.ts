import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FeedbackService } from '../../core/services/feedback.service';
import type { FailurePattern, PatternPage } from '../../core/models/feedback.model';

@Component({
  selector: 'app-patterns',
  standalone: true,
  imports: [RouterLink],
  template: `
<nav class="breadcrumb">
  <a routerLink="/" class="bc-link">Dashboard</a>
  <span class="bc-sep">›</span>
  <span class="bc-current">Pattern Intelligence</span>
</nav>

<div class="page-header">
  <div>
    <p class="page-eyebrow">Self-Learning</p>
    <h1 class="page-title">Pattern Intelligence</h1>
    <p class="page-desc">AI learns from past fix outcomes to improve future suggestions for recurring failure patterns.</p>
  </div>
</div>

@if (upgradeRequired()) {
  <div class="upgrade-card">
    <div class="upgrade-icon">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    </div>
    <div>
      <h2 class="upgrade-title">Pro feature</h2>
      <p class="upgrade-desc">Pattern Intelligence is available on Pro and Business plans. Upgrade to see how AI learns from your fix history and applies it to future analyses.</p>
      <a routerLink="/pricing" class="btn btn-primary">Upgrade to Pro</a>
    </div>
  </div>
}

@if (loading()) {
  <div class="loading-grid">
    @for (_ of [1,2,3,4,5,6]; track $index) {
      <div class="skeleton-card"></div>
    }
  </div>
}

@if (!loading() && !upgradeRequired()) {
  @if (data()?.total === 0) {
    <div class="empty-state">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
      </svg>
      <h3>No patterns yet</h3>
      <p>Patterns are built automatically as FixMyBuild analyses failures and tracks fix outcomes. Keep running pipelines and patterns will appear here.</p>
    </div>
  } @else if (data()) {
    <div class="meta-row">
      <span class="meta-total">{{ data()!.total }} pattern{{ data()!.total !== 1 ? 's' : '' }} learned</span>
    </div>

    <div class="patterns-grid">
      @for (p of data()!.items; track p.id) {
        <div class="pattern-card">
          <div class="pattern-card-header">
            <span class="cat-badge">{{ categoryIcon(p.category) }} {{ p.category }}</span>
            <span class="occ-badge" title="Times this pattern has been seen">
              {{ p.occurrenceCount }}×
            </span>
          </div>

          <div class="fp-row">
            <span class="fp-label">Fingerprint</span>
            <code class="fp-code">{{ p.errorFingerprint }}</code>
          </div>

          <div class="stats-row">
            <div class="stat-pill stat-accepted" title="Accepted fixes">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              {{ p.acceptedCount }}
            </div>
            <div class="stat-pill stat-rejected" title="Rejected fixes">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              {{ p.rejectedCount }}
            </div>
            <div class="stat-pill stat-modified" title="Modified fixes">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {{ p.modifiedCount }}
            </div>
          </div>

          <div class="acceptance-row">
            <span class="acceptance-label">Acceptance rate</span>
            <div class="acceptance-bar-wrap">
              <div class="acceptance-bar"
                [style.width.%]="p.acceptanceRatePct"
                [class.bar-high]="p.acceptanceRatePct >= 70"
                [class.bar-mid]="p.acceptanceRatePct >= 40 && p.acceptanceRatePct < 70"
                [class.bar-low]="p.acceptanceRatePct < 40">
              </div>
            </div>
            <span class="acceptance-pct">{{ p.acceptanceRatePct }}%</span>
          </div>

          @if (p.hasSuccessfulFix) {
            <div class="fix-indicator">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
              Known successful fix available
            </div>
          }

          <div class="card-footer">
            <span class="ts-label">First seen {{ formatDate(p.firstSeenAt) }}</span>
            <span class="ts-label">Last seen {{ formatDate(p.lastSeenAt) }}</span>
          </div>
        </div>
      }
    </div>

    @if (data()!.total > pageSize) {
      <div class="pagination">
        <button class="btn btn-ghost" (click)="prevPage()" [disabled]="page === 1">← Prev</button>
        <span class="page-info">Page {{ page }} of {{ totalPages() }}</span>
        <button class="btn btn-ghost" (click)="nextPage()" [disabled]="page >= totalPages()">Next →</button>
      </div>
    }
  }
}
  `,
  styles: [`
    .breadcrumb { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.25rem; font-size: 0.875rem; }
    .bc-link { color: var(--text-muted); text-decoration: none; &:hover { color: var(--primary); } }
    .bc-sep { color: var(--text-faint); }
    .bc-current { color: var(--text); font-weight: 500; }

    .page-header { margin-bottom: 1.5rem; }
    .page-eyebrow { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--primary); margin: 0 0 0.25rem; }
    .page-title { font-size: 1.625rem; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 0.375rem; color: var(--text); }
    .page-desc { font-size: 0.875rem; color: var(--text-muted); margin: 0; }

    /* Upgrade card */
    .upgrade-card {
      display: flex; gap: 1.5rem; align-items: flex-start;
      padding: 1.5rem; border: 1px solid #fde68a;
      border-radius: var(--radius-lg); background: #fffbeb; margin-bottom: 2rem;
    }
    .upgrade-icon { color: #92400e; flex-shrink: 0; padding-top: 0.125rem; }
    .upgrade-title { font-size: 1.125rem; font-weight: 700; color: var(--text); margin: 0 0 0.375rem; }
    .upgrade-desc { font-size: 0.875rem; color: var(--text-muted); margin: 0 0 1rem; line-height: 1.6; max-width: 480px; }

    /* Skeleton */
    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .skeleton-card {
      height: 180px; border-radius: var(--radius-lg);
      background: linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%);
      background-size: 200% 100%; animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    /* Empty */
    .empty-state { text-align: center; padding: 5rem 2rem; color: var(--text-muted); }
    .empty-state svg { margin: 0 auto 1rem; display: block; opacity: 0.3; }
    .empty-state h3 { font-size: 1.125rem; font-weight: 700; color: var(--text); margin: 0 0 0.5rem; }
    .empty-state p { font-size: 0.875rem; max-width: 400px; margin: 0 auto; line-height: 1.6; }

    /* Meta */
    .meta-row { margin-bottom: 1rem; }
    .meta-total { font-size: 0.8125rem; color: var(--text-muted); font-weight: 500; }

    /* Grid */
    .patterns-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }

    /* Card */
    .pattern-card {
      border: 1px solid var(--border); border-radius: var(--radius-lg);
      background: var(--bg); padding: 1.25rem;
      display: flex; flex-direction: column; gap: 0.75rem;
      transition: box-shadow var(--transition);
      &:hover { box-shadow: var(--shadow-sm); }
    }
    .pattern-card-header { display: flex; align-items: center; justify-content: space-between; }
    .cat-badge {
      display: inline-flex; align-items: center; gap: 0.25rem;
      padding: 0.2rem 0.6rem; border-radius: 9999px;
      background: var(--primary-bg); color: var(--primary);
      border: 1px solid rgba(79,70,229,0.2);
      font-size: 0.75rem; font-weight: 600; text-transform: capitalize;
    }
    .occ-badge {
      padding: 0.2rem 0.6rem; border-radius: 9999px;
      background: var(--bg-subtle); color: var(--text);
      border: 1px solid var(--border);
      font-size: 0.75rem; font-weight: 700;
    }

    /* Fingerprint */
    .fp-row { display: flex; flex-direction: column; gap: 0.2rem; }
    .fp-label { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-faint); }
    .fp-code { font-family: ui-monospace, monospace; font-size: 0.75rem; color: var(--text-muted); }

    /* Stats */
    .stats-row { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .stat-pill {
      display: inline-flex; align-items: center; gap: 0.25rem;
      padding: 0.2rem 0.5rem; border-radius: 9999px;
      font-size: 0.75rem; font-weight: 600; border: 1px solid;
    }
    .stat-accepted { background: #f0fdf4; color: #15803d; border-color: #86efac; }
    .stat-rejected { background: #fef2f2; color: #dc2626; border-color: #fca5a5; }
    .stat-modified { background: #fffbeb; color: #92400e; border-color: #fde68a; }

    /* Acceptance bar */
    .acceptance-row { display: flex; align-items: center; gap: 0.5rem; }
    .acceptance-label { font-size: 0.6875rem; color: var(--text-faint); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap; }
    .acceptance-bar-wrap { flex: 1; height: 6px; background: var(--border); border-radius: 9999px; overflow: hidden; }
    .acceptance-bar { height: 100%; border-radius: 9999px; transition: width 0.4s; }
    .bar-high { background: #22c55e; }
    .bar-mid  { background: #f59e0b; }
    .bar-low  { background: #ef4444; }
    .acceptance-pct { font-size: 0.75rem; font-weight: 700; color: var(--text); min-width: 36px; text-align: right; }

    /* Successful fix indicator */
    .fix-indicator {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.75rem; font-weight: 600; color: #15803d;
    }

    /* Card footer */
    .card-footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 0.25rem; border-top: 1px solid var(--border-light); padding-top: 0.75rem; }
    .ts-label { font-size: 0.6875rem; color: var(--text-faint); }

    /* Buttons */
    .btn {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.5rem 1.25rem; border-radius: var(--radius-sm);
      font-size: 0.8125rem; font-weight: 600; border: none; cursor: pointer;
      transition: all var(--transition);
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-primary { background: var(--primary); color: #fff; &:hover:not(:disabled) { background: var(--primary-dark); } }
    .btn-ghost { background: var(--bg-subtle); color: var(--text); border: 1px solid var(--border); &:hover:not(:disabled) { background: var(--border); } }

    /* Pagination */
    .pagination { display: flex; align-items: center; gap: 1rem; justify-content: center; margin-top: 0.5rem; }
    .page-info { font-size: 0.875rem; color: var(--text-muted); }
  `]
})
export class PatternsComponent implements OnInit {
  data = signal<PatternPage | null>(null);
  loading = signal(true);
  upgradeRequired = signal(false);

  page = 1;
  readonly pageSize = 20;

  constructor(private readonly feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.loadPatterns();
  }

  private loadPatterns(): void {
    this.loading.set(true);
    this.feedbackService.getPatterns(this.page, this.pageSize).subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 402) this.upgradeRequired.set(true);
      },
    });
  }

  totalPages(): number {
    return Math.ceil((this.data()?.total ?? 0) / this.pageSize);
  }

  prevPage(): void {
    if (this.page > 1) { this.page--; this.loadPatterns(); }
  }

  nextPage(): void {
    if (this.page < this.totalPages()) { this.page++; this.loadPatterns(); }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  categoryIcon(cat: string): string {
    switch (cat.toLowerCase()) {
      case 'dependency': return '📦';
      case 'code':       return '💻';
      case 'configuration': return '⚙️';
      case 'test':       return '🧪';
      case 'infrastructure': return '🏗️';
      default: return '🔧';
    }
  }
}
