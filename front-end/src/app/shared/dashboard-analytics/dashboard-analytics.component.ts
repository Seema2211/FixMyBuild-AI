import { Component, input, computed, signal } from '@angular/core';
import type { PipelineAnalytics, DailyCount, CategoryCount, ConfidenceBucket, RepoCount } from '../../core/models/pipeline.model';

@Component({
  selector: 'app-dashboard-analytics',
  standalone: true,
  imports: [],
  template: `
@if (data(); as d) {

<!-- ═══════════════════════════════════════════════════════════
     SECTION 1 — IMPACT METRICS (Before vs After)
═══════════════════════════════════════════════════════════ -->
<section class="impact-section">
  <p class="section-eyebrow">Before vs After · FixMyBuild AI Impact</p>

  <div class="impact-grid">

    <!-- Failures Analyzed -->
    <div class="impact-card ic-blue">
      <div class="ic-top">
        <div class="ic-icon" style="background:#eef2ff;color:#4f46e5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <span class="ic-label">Failures Analyzed</span>
      </div>
      <div class="ic-compare">
        <div class="ic-before-col">
          <span class="ic-tag ic-before-tag">Before</span>
          <span class="ic-before-val">Manual</span>
          <span class="ic-sub">hours of debugging</span>
        </div>
        <div class="ic-arrow" style="color:rgba(79,70,229,0.5)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
        <div class="ic-after-col">
          <span class="ic-tag" style="color:#4f46e5">After</span>
          <span class="ic-after-val" style="color:#4f46e5">{{ d.impact.totalAnalyzed }}</span>
          <span class="ic-sub">analyzed automatically</span>
        </div>
      </div>
    </div>

    <!-- Fix PRs Created -->
    <div class="impact-card ic-green">
      <div class="ic-top">
        <div class="ic-icon" style="background:#ecfdf5;color:#059669">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7M6 9v12"/></svg>
        </div>
        <span class="ic-label">Fix PRs Created</span>
      </div>
      <div class="ic-compare">
        <div class="ic-before-col">
          <span class="ic-tag ic-before-tag">Before</span>
          <span class="ic-before-val">0</span>
          <span class="ic-sub">manual PR creation</span>
        </div>
        <div class="ic-arrow" style="color:rgba(5,150,105,0.5)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
        <div class="ic-after-col">
          <span class="ic-tag" style="color:#059669">After</span>
          <span class="ic-after-val" style="color:#059669">{{ d.impact.autoPRs }}</span>
          <span class="ic-sub">auto-generated PRs</span>
        </div>
      </div>
    </div>

    <!-- Dev Hours Saved -->
    <div class="impact-card ic-orange">
      <div class="ic-top">
        <div class="ic-icon" style="background:#fffbeb;color:#d97706">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <span class="ic-label">Est. Dev Hours Saved</span>
      </div>
      <div class="ic-compare">
        <div class="ic-before-col">
          <span class="ic-tag ic-before-tag">Before</span>
          <span class="ic-before-val" style="text-decoration:line-through;text-decoration-color:#dc2626">{{ d.impact.manualHours }}h</span>
          <span class="ic-sub">manual debug time</span>
        </div>
        <div class="ic-arrow" style="color:rgba(217,119,6,0.5)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </div>
        <div class="ic-after-col">
          <span class="ic-tag" style="color:#d97706">After</span>
          <span class="ic-after-val" style="color:#d97706">{{ d.impact.devHoursSaved }}h</span>
          <span class="ic-sub">saved with AI analysis</span>
        </div>
      </div>
    </div>

  </div>
</section>

<!-- ═══════════════════════════════════════════════════════════
     SECTION 2 — PATTERN RECOGNITION (Category Distribution)
═══════════════════════════════════════════════════════════ -->
<div class="two-col">

  <div class="chart-card">
    <div class="chart-header">
      <div>
        <p class="chart-eyebrow">Pattern Recognition</p>
        <h3 class="chart-title">Failure Categories</h3>
      </div>
      <span class="chart-total-badge">{{ d.impact.totalAnalyzed }} total</span>
    </div>

    @if (d.categoryDistribution.length === 0) {
      <p class="chart-empty">No data yet — analyze some pipeline runs.</p>
    } @else {
      <div class="chart-body">
        @for (cat of d.categoryDistribution; track cat.category) {
          <div class="chart-row">
            <div class="chart-label-col">
              <span class="cat-badge" [style.background]="cat.color + '18'" [style.border-color]="cat.color + '40'" [style.color]="cat.color">
                {{ categoryIcon(cat.category) }} {{ cat.category }}
              </span>
            </div>
            <div class="chart-bar-col">
              <div class="chart-track">
                <div class="chart-fill"
                  [style.width]="barWidth(cat.count, d.categoryDistribution) + '%'"
                  [style.background]="cat.color">
                </div>
              </div>
            </div>
            <div class="chart-count-col">
              <span class="chart-count-num">{{ cat.count }}</span>
              <span class="chart-count-pct">{{ pct(cat.count, d.impact.totalAnalyzed) }}%</span>
            </div>
          </div>
        }
      </div>
    }
  </div>

  <!-- ── Confidence Distribution ── -->
  <div class="chart-card">
    <div class="chart-header">
      <div>
        <p class="chart-eyebrow">Fix Confidence</p>
        <h3 class="chart-title">Confidence Distribution</h3>
      </div>
    </div>

    @if (d.impact.totalAnalyzed === 0) {
      <p class="chart-empty">No data yet.</p>
    } @else {
      <div class="chart-body">
        @for (b of d.confidenceDistribution; track b.range) {
          <div class="hbar-row">
            <span class="hbar-label" [style.color]="b.color">{{ b.range }}</span>
            <div class="hbar-track">
              <div class="hbar-fill"
                [style.width]="barWidth(b.count, d.confidenceDistribution) + '%'"
                [style.background]="b.color">
              </div>
            </div>
            <span class="hbar-count">{{ b.count }}</span>
            <span class="hbar-pct">{{ pct(b.count, d.impact.totalAnalyzed) }}%</span>
          </div>
        }
      </div>
      <div class="conf-legend">
        <span class="conf-legend-item" style="color:#059669">
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
          ≥60% = PR-ready
        </span>
        <span class="conf-legend-item" style="color:#dc2626">
          <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
          &lt;40% = review needed
        </span>
      </div>
    }
  </div>

</div>

<!-- ═══════════════════════════════════════════════════════════
     SECTION 3 — TREND CHARTS
═══════════════════════════════════════════════════════════ -->
<section class="trend-section">
  <div class="trend-section-header">
    <div>
      <p class="section-eyebrow" style="margin-bottom:0.2rem">Analytics</p>
      <h2 class="trend-title">Trend Charts</h2>
    </div>
    <div class="trend-toggle">
      <button class="trend-btn" [class.trend-btn-active]="trendRange() === '7d'" (click)="trendRange.set('7d')">7d</button>
      <button class="trend-btn" [class.trend-btn-active]="trendRange() === '30d'" (click)="trendRange.set('30d')">30d</button>
    </div>
  </div>

  <div class="trend-grid">

    <!-- Daily Failures bar chart -->
    <div class="trend-panel">
      <div class="trend-panel-header">
        <h4 class="trend-panel-title">Daily Failures</h4>
        <span class="trend-badge">{{ trendRange() }}</span>
      </div>
      @if (allDailyZero()) {
        <p class="trend-empty">No failures in this period.</p>
      } @else {
        <div class="daily-bars">
          @for (day of dailyData(); track day.date) {
            <div class="daily-col">
              <div class="daily-fill"
                [style.height]="dailyBarHeight(day.count) + '%'"
                [style.opacity]="day.count === 0 ? '0.18' : '1'"
                [title]="day.date + ': ' + day.count">
              </div>
              @if (shouldShowLabel(dailyData(), $index)) {
                <span class="daily-label">{{ shortDate(day.date) }}</span>
              } @else {
                <span class="daily-label">&nbsp;</span>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Top Repos -->
    <div class="trend-panel">
      <div class="trend-panel-header">
        <h4 class="trend-panel-title">Top Repositories</h4>
        <span class="trend-badge">by failures</span>
      </div>
      @if (d.topRepos.length === 0) {
        <p class="trend-empty">No repository data yet.</p>
      } @else {
        <div class="hbar-list">
          @for (r of d.topRepos; track r.repo) {
            <div class="hbar-row">
              <span class="hbar-label">{{ shortRepo(r.repo) }}</span>
              <div class="hbar-track">
                <div class="hbar-fill hbar-primary"
                  [style.width]="barWidth(r.count, d.topRepos) + '%'">
                </div>
              </div>
              <span class="hbar-count">{{ r.count }}</span>
              <span class="hbar-pct">{{ pct(r.count, d.impact.totalAnalyzed) }}%</span>
            </div>
          }
        </div>
      }
    </div>

  </div>
</section>

}
  `,
  styles: [`
    /* ── Shared eyebrow / section titles ── */
    .section-eyebrow {
      font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.09em; color: var(--text-faint); margin: 0 0 0.625rem;
    }

    /* ══════════════════════════════════════════
       IMPACT METRICS
    ══════════════════════════════════════════ */
    .impact-section { margin-bottom: 1.5rem; }

    .impact-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
    }
    @media (max-width: 900px)  { .impact-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px)  { .impact-grid { grid-template-columns: 1fr; } }

    .impact-card {
      background: #fff;
      border-radius: var(--radius-lg);
      border: 1.5px solid;
      padding: 1.25rem 1.375rem;
      box-shadow: var(--shadow-xs);
      position: relative; overflow: hidden;
      transition: box-shadow var(--transition), transform var(--transition);
      cursor: default;
      &::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
      &:hover { box-shadow: var(--shadow-sm); transform: translateY(-1px); }
    }
    .ic-blue   { border-color: #c7d2fe; &::before { background: #4f46e5; } }
    .ic-green  { border-color: var(--success-border); &::before { background: var(--success); } }
    .ic-orange { border-color: var(--warning-border); &::before { background: var(--warning); } }

    .ic-top { display: flex; align-items: center; gap: 0.625rem; margin-bottom: 1rem; }
    .ic-icon { width: 30px; height: 30px; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ic-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); }

    .ic-compare { display: flex; align-items: center; gap: 0.625rem; }
    .ic-before-col, .ic-after-col { display: flex; flex-direction: column; flex: 1; }
    .ic-tag { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.1rem; }
    .ic-before-tag { color: var(--text-faint); }
    .ic-before-val { font-size: 1rem; font-weight: 700; color: var(--text-muted); line-height: 1.2; }
    .ic-after-val { font-size: 1.375rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; }
    .ic-sub { font-size: 0.6875rem; color: var(--text-faint); margin-top: 0.1rem; line-height: 1.3; }
    .ic-arrow { flex-shrink: 0; display: flex; align-items: center; }

    /* ══════════════════════════════════════════
       TWO-COLUMN LAYOUT FOR CHARTS
    ══════════════════════════════════════════ */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

    /* ══════════════════════════════════════════
       CHART CARD (shared between sections 2 & 3)
    ══════════════════════════════════════════ */
    .chart-card {
      background: #fff;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow-xs);
    }
    .chart-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.25rem;
    }
    .chart-eyebrow { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--text-faint); margin: 0 0 0.2rem; }
    .chart-title { font-size: 1rem; font-weight: 700; color: var(--text); letter-spacing: -0.01em; margin: 0; }
    .chart-total-badge {
      font-size: 0.8125rem; color: var(--text-muted);
      background: var(--bg-subtle); border: 1px solid var(--border);
      padding: 0.25rem 0.75rem; border-radius: 9999px; white-space: nowrap; flex-shrink: 0;
    }
    .chart-empty { font-size: 0.875rem; color: var(--text-faint); margin: 0; padding: 1rem 0; }

    /* ── Category horizontal bars ── */
    .chart-body { display: flex; flex-direction: column; gap: 0.625rem; }
    .chart-row { display: grid; grid-template-columns: 160px 1fr 72px; align-items: center; gap: 1rem; }
    @media (max-width: 640px) { .chart-row { grid-template-columns: 120px 1fr 56px; gap: 0.5rem; } }

    .chart-label-col {}
    .cat-badge {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.25rem 0.625rem; border-radius: 9999px;
      border: 1px solid;
      font-size: 0.75rem; font-weight: 600; white-space: nowrap;
    }
    .chart-bar-col {}
    .chart-track { width: 100%; height: 10px; background: var(--border-light); border-radius: 9999px; overflow: hidden; }
    .chart-fill { height: 100%; border-radius: 9999px; transition: width 0.7s cubic-bezier(0.4,0,0.2,1); min-width: 4px; }
    .chart-count-col { display: flex; flex-direction: column; align-items: flex-end; }
    .chart-count-num { font-size: 0.8125rem; font-weight: 700; color: var(--text); }
    .chart-count-pct { font-size: 0.6875rem; color: var(--text-faint); }

    /* ── Horizontal bars (reused) ── */
    .hbar-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .hbar-row { display: grid; grid-template-columns: 90px 1fr 28px 38px; align-items: center; gap: 0.625rem; }
    @media (max-width: 640px) { .hbar-row { grid-template-columns: 70px 1fr 24px 34px; gap: 0.375rem; } }
    .hbar-label { font-size: 0.75rem; font-weight: 500; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .hbar-track { height: 8px; background: var(--border-light); border-radius: 9999px; overflow: hidden; }
    .hbar-fill { height: 100%; border-radius: 9999px; transition: width 0.5s cubic-bezier(0.4,0,0.2,1); min-width: 3px; }
    .hbar-primary { background: var(--primary); }
    .hbar-count { font-size: 0.8125rem; font-weight: 700; color: var(--text); text-align: right; }
    .hbar-pct { font-size: 0.6875rem; color: var(--text-faint); text-align: right; }

    /* ── Confidence legend ── */
    .conf-legend { display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap; }
    .conf-legend-item { display: inline-flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 500; }

    /* ══════════════════════════════════════════
       TREND CHARTS
    ══════════════════════════════════════════ */
    .trend-section { margin-top: 0; }
    .trend-section-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1rem; flex-wrap: wrap; gap: 0.75rem;
    }
    .trend-title { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text); margin: 0; }

    .trend-toggle {
      display: flex; border: 1.5px solid var(--border);
      border-radius: var(--radius-sm); overflow: hidden;
    }
    .trend-btn {
      padding: 0.35rem 0.875rem; border: none; background: #fff;
      font-size: 0.8125rem; font-weight: 600; cursor: pointer; font-family: inherit;
      color: var(--text-muted); transition: all var(--transition);
      &:hover:not(.trend-btn-active) { background: var(--bg-subtle); }
    }
    .trend-btn-active { background: var(--primary) !important; color: #fff !important; }

    .trend-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    @media (max-width: 768px) { .trend-grid { grid-template-columns: 1fr; } }

    .trend-panel {
      background: #fff;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.5rem;
      box-shadow: var(--shadow-xs);
    }
    .trend-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .trend-panel-title { font-size: 0.875rem; font-weight: 700; color: var(--text); margin: 0; }
    .trend-badge {
      font-size: 0.75rem; font-weight: 600;
      padding: 0.2rem 0.625rem; background: var(--bg-subtle);
      border: 1px solid var(--border); border-radius: 9999px;
      color: var(--text-muted);
    }
    .trend-empty { font-size: 0.875rem; color: var(--text-faint); margin: 0; padding: 0.5rem 0; }

    /* Daily vertical bar chart */
    .daily-bars {
      display: flex; align-items: flex-end; gap: 3px;
      height: 80px; padding-bottom: 1.25rem; position: relative;
    }
    .daily-col {
      flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;
      height: 100%; gap: 3px;
    }
    .daily-fill {
      width: 100%; background: var(--primary);
      border-radius: 3px 3px 0 0; min-height: 2px;
      transition: height 0.4s ease, opacity 0.2s;
      &:hover { background: var(--primary-dark); }
    }
    .daily-label { font-size: 0.625rem; color: var(--text-faint); white-space: nowrap; text-align: center; line-height: 1; }
  `]
})
export class DashboardAnalyticsComponent {
  data = input<PipelineAnalytics | null>(null);
  trendRange = signal<'7d' | '30d'>('7d');

  dailyData = computed(() => {
    const d = this.data();
    if (!d) return [];
    return this.trendRange() === '7d' ? d.dailyFailures7d : d.dailyFailures30d;
  });

  maxDailyCount = computed(() => Math.max(...this.dailyData().map(d => d.count), 1));

  allDailyZero = computed(() => this.dailyData().every(d => d.count === 0));

  dailyBarHeight(count: number): number {
    if (count === 0) return 4;
    return Math.round((count / this.maxDailyCount()) * 100);
  }

  shouldShowLabel(days: DailyCount[], index: number): boolean {
    const len = days.length;
    if (len <= 7) return true;
    // For 30d show every 5th label
    return index === 0 || index === len - 1 || index % 5 === 0;
  }

  shortDate(date: string): string {
    // "Mar 15" → "Mar 15" already; just return as-is; for 30d show short version
    const parts = date.split(' ');
    return parts.length === 2 ? parts[1] : date;
  }

  shortRepo(repo: string): string {
    // "owner/repo" → show just repo name if too long
    const parts = repo.split('/');
    return parts.length === 2 ? parts[1] : repo;
  }

  barWidth(count: number, items: Array<{ count: number }>): number {
    const max = Math.max(...items.map((i: { count: number }) => i.count), 1);
    return Math.round((count / max) * 100);
  }

  pct(count: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  categoryIcon(cat: string): string {
    switch (cat.toLowerCase()) {
      case 'dependency':     return '📦';
      case 'code':           return '💻';
      case 'configuration':  return '⚙️';
      case 'test':           return '🧪';
      case 'infrastructure': return '🏗️';
      case 'security':       return '🔒';
      default:               return '🔧';
    }
  }
}
