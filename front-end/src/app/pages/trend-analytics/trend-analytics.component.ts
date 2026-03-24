import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PipelineService } from '../../core/services/pipeline.service';
import type { PipelineAnalytics, DailySeverityCount, DailyConfidenceAvg, DailyCount } from '../../core/models/pipeline.model';

@Component({
  selector: 'app-trend-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<!-- ═══ Page Header ═══ -->
<div class="page-header">
  <div class="breadcrumb">
    <a routerLink="/" class="breadcrumb-link">Dashboard</a>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    <span class="breadcrumb-current">Trend Analytics</span>
  </div>
  <div class="header-row">
    <div>
      <h1 class="page-title">Trend Analytics</h1>
      <p class="page-desc">Failure trends, severity patterns, confidence tracking, and resolution metrics.</p>
    </div>
    <div class="range-toggle">
      <button class="range-btn" [class.active]="range() === '7d'" (click)="range.set('7d')">7 Days</button>
      <button class="range-btn" [class.active]="range() === '30d'" (click)="range.set('30d')">30 Days</button>
    </div>
  </div>
</div>

@if (loading()) {
  <div class="loading-bar"><div class="loading-bar-inner"></div></div>
}

@if (data(); as d) {

<!-- ═══ MTTR Metrics Row ═══ -->
<div class="mttr-row">
  <div class="mttr-card">
    <div class="mttr-icon" style="background:#eef2ff;color:#4f46e5">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    </div>
    <div class="mttr-body">
      <span class="mttr-value" style="color:#4f46e5">{{ d.mttr.avgMinutesToPr | number:'1.0-1' }} min</span>
      <span class="mttr-label">Avg. Time to PR</span>
    </div>
  </div>
  <div class="mttr-card">
    <div class="mttr-icon" style="background:#ecfdf5;color:#059669">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    </div>
    <div class="mttr-body">
      <span class="mttr-value" style="color:#059669">{{ d.mttr.autoFixRate }}%</span>
      <span class="mttr-label">Auto-Fix Rate</span>
    </div>
  </div>
  <div class="mttr-card">
    <div class="mttr-icon" style="background:#f3e8ff;color:#7c3aed">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
    </div>
    <div class="mttr-body">
      <span class="mttr-value" style="color:#7c3aed">{{ d.mttr.avgConfidence }}%</span>
      <span class="mttr-label">Avg. Confidence</span>
    </div>
  </div>
  <div class="mttr-card">
    <div class="mttr-icon" style="background:#fef2f2;color:#dc2626">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>
    <div class="mttr-body">
      <span class="mttr-value" style="color:#dc2626">{{ d.mttr.highSeverityRate }}%</span>
      <span class="mttr-label">High Severity Rate</span>
    </div>
  </div>
</div>

<!-- ═══ Daily Failures Line Chart ═══ -->
<div class="chart-panel full-width">
  <div class="chart-panel-header">
    <div>
      <p class="chart-eyebrow">Failure Frequency</p>
      <h3 class="chart-panel-title">Daily Pipeline Failures</h3>
    </div>
    <span class="chart-badge">{{ range() }}</span>
  </div>
  <div class="svg-chart-container">
    <svg [attr.viewBox]="'0 0 ' + chartW + ' ' + chartH" class="svg-chart" preserveAspectRatio="none">
      <!-- Grid lines -->
      @for (y of yGridLines(); track y) {
        <line [attr.x1]="pad.left" [attr.y1]="y" [attr.x2]="chartW - pad.right" [attr.y2]="y" class="grid-line"/>
      }
      <!-- Area fill -->
      <path [attr.d]="dailyAreaPath()" class="area-fill"/>
      <!-- Line -->
      <path [attr.d]="dailyLinePath()" class="line-stroke"/>
      <!-- Data points -->
      @for (pt of dailyPoints(); track $index) {
        <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5" class="data-dot">
          <title>{{ pt.label }}: {{ pt.value }} failures</title>
        </circle>
      }
    </svg>
    <!-- X-axis labels -->
    <div class="x-axis-labels">
      @for (pt of dailyPoints(); track $index) {
        @if (shouldShowXLabel(dailyPoints(), $index)) {
          <span class="x-label" [style.left.%]="xLabelPct(pt.x)">{{ pt.label }}</span>
        }
      }
    </div>
    <!-- Y-axis labels -->
    <div class="y-axis-labels">
      @for (v of yAxisValues(); track v.val) {
        <span class="y-label" [style.bottom.%]="yLabelPct(v.y)">{{ v.val }}</span>
      }
    </div>
  </div>
</div>

<!-- ═══ Two-col: Severity Trend + Confidence Trend ═══ -->
<div class="two-col">

  <!-- Severity Stacked Bar Chart -->
  <div class="chart-panel">
    <div class="chart-panel-header">
      <div>
        <p class="chart-eyebrow">Severity Breakdown</p>
        <h3 class="chart-panel-title">Severity Trend</h3>
      </div>
      <span class="chart-badge">{{ range() }}</span>
    </div>
    <div class="stacked-chart-container">
      <div class="stacked-bars">
        @for (day of severityData(); track day.date) {
          <div class="stacked-col" [title]="day.date + ' — H:' + day.high + ' M:' + day.medium + ' L:' + day.low">
            @if (day.high + day.medium + day.low > 0) {
              <div class="stacked-seg seg-high" [style.flex]="day.high"></div>
              <div class="stacked-seg seg-medium" [style.flex]="day.medium"></div>
              <div class="stacked-seg seg-low" [style.flex]="day.low"></div>
            } @else {
              <div class="stacked-seg seg-empty" style="flex:1"></div>
            }
          </div>
        }
      </div>
      <div class="stacked-x-labels">
        @for (day of severityData(); track day.date; let i = $index) {
          @if (shouldShowXLabel(severityData(), i)) {
            <span class="x-label-sm">{{ shortDate(day.date) }}</span>
          } @else {
            <span class="x-label-sm">&nbsp;</span>
          }
        }
      </div>
    </div>
    <div class="legend-row">
      <span class="legend-item"><span class="legend-dot" style="background:#dc2626"></span> High</span>
      <span class="legend-item"><span class="legend-dot" style="background:#d97706"></span> Medium</span>
      <span class="legend-item"><span class="legend-dot" style="background:#059669"></span> Low</span>
    </div>
  </div>

  <!-- Confidence Line Chart -->
  <div class="chart-panel">
    <div class="chart-panel-header">
      <div>
        <p class="chart-eyebrow">AI Performance</p>
        <h3 class="chart-panel-title">Confidence Trend</h3>
      </div>
      <span class="chart-badge">{{ range() }}</span>
    </div>
    <div class="svg-chart-container conf-chart">
      <svg [attr.viewBox]="'0 0 ' + chartW + ' ' + confChartH" class="svg-chart" preserveAspectRatio="none">
        <!-- Threshold line at 70% -->
        <line [attr.x1]="pad.left" [attr.y1]="confY(70)"
              [attr.x2]="chartW - pad.right" [attr.y2]="confY(70)"
              class="threshold-line"/>
        <text [attr.x]="chartW - pad.right + 4" [attr.y]="confY(70) + 3" class="threshold-label">70%</text>
        <!-- Area -->
        <path [attr.d]="confAreaPath()" class="conf-area-fill"/>
        <!-- Line -->
        <path [attr.d]="confLinePath()" class="conf-line-stroke"/>
        <!-- Points -->
        @for (pt of confPoints(); track $index) {
          @if (pt.value > 0) {
            <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="3.5" class="conf-dot">
              <title>{{ pt.label }}: {{ pt.value }}% avg ({{ pt.count }} runs)</title>
            </circle>
          }
        }
      </svg>
      <div class="x-axis-labels">
        @for (pt of confPoints(); track $index) {
          @if (shouldShowXLabel(confPoints(), $index)) {
            <span class="x-label" [style.left.%]="xLabelPct(pt.x)">{{ pt.label }}</span>
          }
        }
      </div>
    </div>
    <div class="legend-row">
      <span class="legend-item"><span class="legend-dot" style="background:#7c3aed"></span> Avg Confidence</span>
      <span class="legend-item"><span class="legend-line" style="border-color:#f97316"></span> 70% PR Threshold</span>
    </div>
  </div>

</div>

}
  `,
  styles: [`
    :host { display: block; }

    .page-header { margin-bottom: 1.75rem; }
    .breadcrumb {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.8125rem; color: #9ca3af; margin-bottom: 1rem;
    }
    .breadcrumb-link { color: #6b7280; text-decoration: none; &:hover { color: #4f46e5; } }
    .breadcrumb-current { color: #111827; font-weight: 600; }
    .header-row {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; flex-wrap: wrap;
    }
    .page-title { font-size: 1.75rem; font-weight: 800; color: #111827; letter-spacing: -0.03em; margin: 0 0 0.375rem; }
    .page-desc { font-size: 0.9375rem; color: #6b7280; margin: 0; }

    .range-toggle {
      display: flex; border: 1.5px solid #e2e8f0; border-radius: 8px; overflow: hidden;
    }
    .range-btn {
      padding: 0.4375rem 1rem; border: none; background: white;
      font-size: 0.8125rem; font-weight: 600; cursor: pointer; font-family: inherit;
      color: #6b7280; transition: all 150ms ease;
      &:hover:not(.active) { background: #f8fafc; }
      &.active { background: #4f46e5; color: white; }
    }

    /* Loading */
    .loading-bar { height: 3px; background: #e5e7eb; border-radius: 2px; overflow: hidden; margin-bottom: 1.5rem; }
    .loading-bar-inner { height: 100%; width: 40%; background: linear-gradient(90deg, #4f46e5, #a855f7); border-radius: 2px; animation: loadSlide 1.2s ease-in-out infinite; }
    @keyframes loadSlide { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }

    /* ═══ MTTR Row ═══ */
    .mttr-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 900px) { .mttr-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .mttr-row { grid-template-columns: 1fr; } }

    .mttr-card {
      display: flex; align-items: center; gap: 0.875rem;
      padding: 1.125rem 1.25rem;
      background: white; border: 1.5px solid #e2e8f0; border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      transition: box-shadow 150ms, transform 150ms;
      &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
    }
    .mttr-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .mttr-body { display: flex; flex-direction: column; }
    .mttr-value { font-size: 1.375rem; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; }
    .mttr-label { font-size: 0.75rem; font-weight: 600; color: #6b7280; margin-top: 0.125rem; }

    /* ═══ Chart Panels ═══ */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

    .chart-panel {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 14px;
      padding: 1.375rem 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      margin-bottom: 1.5rem;
    }
    .full-width { grid-column: 1 / -1; }
    .chart-panel-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.25rem;
    }
    .chart-eyebrow { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: #9ca3af; margin: 0 0 0.15rem; }
    .chart-panel-title { font-size: 1rem; font-weight: 700; color: #111827; margin: 0; }
    .chart-badge {
      font-size: 0.75rem; font-weight: 600;
      padding: 0.2rem 0.625rem; background: #f8fafc;
      border: 1px solid #e2e8f0; border-radius: 99px; color: #6b7280;
    }

    /* ═══ SVG Line Chart ═══ */
    .svg-chart-container {
      position: relative; padding-left: 32px; padding-bottom: 24px;
    }
    .conf-chart { padding-bottom: 24px; }
    .svg-chart { width: 100%; height: 180px; display: block; }

    .grid-line { stroke: #f1f5f9; stroke-width: 1; }
    .area-fill { fill: url(#areaGrad); opacity: 0.15; }
    .line-stroke { fill: none; stroke: #4f46e5; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .data-dot { fill: #4f46e5; stroke: white; stroke-width: 2; cursor: pointer; transition: r 150ms; }
    .data-dot:hover { r: 5.5; }

    .conf-area-fill { fill: #7c3aed; opacity: 0.1; }
    .conf-line-stroke { fill: none; stroke: #7c3aed; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
    .conf-dot { fill: #7c3aed; stroke: white; stroke-width: 2; cursor: pointer; }
    .conf-dot:hover { r: 5.5; }
    .threshold-line { stroke: #f97316; stroke-width: 1.5; stroke-dasharray: 6 4; }
    .threshold-label { fill: #f97316; font-size: 9px; font-weight: 600; }

    .x-axis-labels {
      position: relative; height: 20px; margin-top: 4px; margin-left: 32px;
    }
    .x-label {
      position: absolute; transform: translateX(-50%);
      font-size: 0.625rem; color: #9ca3af; white-space: nowrap;
    }
    .y-axis-labels { position: absolute; top: 0; left: 0; bottom: 24px; width: 28px; }
    .y-label {
      position: absolute; right: 4px; transform: translateY(50%);
      font-size: 0.625rem; color: #9ca3af;
    }

    /* ═══ Stacked Bar Chart ═══ */
    .stacked-chart-container { margin-bottom: 0.75rem; }
    .stacked-bars {
      display: flex; gap: 3px; height: 140px; align-items: flex-end;
    }
    .stacked-col {
      flex: 1; display: flex; flex-direction: column; height: 100%;
      justify-content: flex-end; border-radius: 3px 3px 0 0; overflow: hidden;
      cursor: pointer; transition: opacity 150ms;
      &:hover { opacity: 0.85; }
    }
    .stacked-seg { min-height: 0; transition: flex 0.4s ease; }
    .seg-high { background: #dc2626; }
    .seg-medium { background: #d97706; }
    .seg-low { background: #059669; }
    .seg-empty { background: #f1f5f9; }

    .stacked-x-labels {
      display: flex; gap: 3px; margin-top: 4px;
    }
    .x-label-sm {
      flex: 1; text-align: center;
      font-size: 0.5625rem; color: #9ca3af;
    }

    /* Legend */
    .legend-row { display: flex; gap: 1rem; margin-top: 0.75rem; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 0.375rem; font-size: 0.75rem; font-weight: 500; color: #6b7280; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .legend-line { width: 16px; height: 0; border-top: 2px dashed; flex-shrink: 0; }
  `]
})
export class TrendAnalyticsComponent implements OnInit {
  data = signal<PipelineAnalytics | null>(null);
  loading = signal(true);
  range = signal<'7d' | '30d'>('7d');

  // Chart dimensions
  chartW = 600;
  chartH = 180;
  confChartH = 160;
  pad = { top: 16, right: 16, bottom: 4, left: 4 };

  constructor(private readonly pipelineService: PipelineService) {}

  ngOnInit(): void {
    this.pipelineService.getAnalytics().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // ── Daily Failures Line Chart ──────────────────────────────

  dailyRaw = computed(() => {
    const d = this.data();
    if (!d) return [];
    return this.range() === '7d' ? d.dailyFailures7d : d.dailyFailures30d;
  });

  maxDaily = computed(() => Math.max(...this.dailyRaw().map(d => d.count), 1));

  dailyPoints = computed(() => {
    const raw = this.dailyRaw();
    const max = this.maxDaily();
    const n = raw.length;
    if (n === 0) return [];
    const xStart = this.pad.left;
    const xEnd = this.chartW - this.pad.right;
    const yStart = this.pad.top;
    const yEnd = this.chartH - this.pad.bottom;
    return raw.map((d, i) => ({
      x: n === 1 ? (xStart + xEnd) / 2 : xStart + (i / (n - 1)) * (xEnd - xStart),
      y: yEnd - (d.count / max) * (yEnd - yStart),
      value: d.count,
      label: d.date,
    }));
  });

  dailyLinePath = computed(() => {
    const pts = this.dailyPoints();
    if (pts.length === 0) return '';
    return 'M ' + pts.map(p => `${p.x},${p.y}`).join(' L ');
  });

  dailyAreaPath = computed(() => {
    const pts = this.dailyPoints();
    if (pts.length === 0) return '';
    const yBottom = this.chartH - this.pad.bottom;
    return `M ${pts[0].x},${yBottom} ` +
      pts.map(p => `L ${p.x},${p.y}`).join(' ') +
      ` L ${pts[pts.length - 1].x},${yBottom} Z`;
  });

  yGridLines = computed(() => {
    const count = 4;
    const yStart = this.pad.top;
    const yEnd = this.chartH - this.pad.bottom;
    return Array.from({ length: count }, (_, i) =>
      yStart + (i / (count - 1)) * (yEnd - yStart)
    );
  });

  yAxisValues = computed(() => {
    const max = this.maxDaily();
    const yStart = this.pad.top;
    const yEnd = this.chartH - this.pad.bottom;
    const steps = [max, Math.round(max * 0.66), Math.round(max * 0.33), 0];
    return steps.map((val, i) => ({
      val,
      y: yStart + (i / (steps.length - 1)) * (yEnd - yStart),
    }));
  });

  // ── Severity Trend ─────────────────────────────────────────

  severityData = computed(() => {
    const d = this.data();
    if (!d) return [];
    return this.range() === '7d' ? d.severityTrend7d : d.severityTrend30d;
  });

  // ── Confidence Trend ───────────────────────────────────────

  confRaw = computed(() => {
    const d = this.data();
    if (!d) return [];
    return this.range() === '7d' ? d.confidenceTrend7d : d.confidenceTrend30d;
  });

  confPoints = computed(() => {
    const raw = this.confRaw();
    const n = raw.length;
    if (n === 0) return [];
    const xStart = this.pad.left;
    const xEnd = this.chartW - this.pad.right;
    return raw.map((d, i) => ({
      x: n === 1 ? (xStart + xEnd) / 2 : xStart + (i / (n - 1)) * (xEnd - xStart),
      y: this.confY(d.avgConfidence),
      value: d.avgConfidence,
      count: d.count,
      label: d.date,
    }));
  });

  confY(val: number): number {
    const yStart = this.pad.top;
    const yEnd = this.confChartH - this.pad.bottom;
    return yEnd - (val / 100) * (yEnd - yStart);
  }

  confLinePath = computed(() => {
    const pts = this.confPoints().filter(p => p.value > 0);
    if (pts.length === 0) return '';
    return 'M ' + pts.map(p => `${p.x},${p.y}`).join(' L ');
  });

  confAreaPath = computed(() => {
    const pts = this.confPoints().filter(p => p.value > 0);
    if (pts.length === 0) return '';
    const yBottom = this.confChartH - this.pad.bottom;
    return `M ${pts[0].x},${yBottom} ` +
      pts.map(p => `L ${p.x},${p.y}`).join(' ') +
      ` L ${pts[pts.length - 1].x},${yBottom} Z`;
  });

  // ── Helpers ────────────────────────────────────────────────

  shouldShowXLabel(items: any[], index: number): boolean {
    const len = items.length;
    if (len <= 7) return true;
    return index === 0 || index === len - 1 || index % 5 === 0;
  }

  xLabelPct(x: number): number {
    return (x / this.chartW) * 100;
  }

  yLabelPct(y: number): number {
    return ((this.chartH - y) / this.chartH) * 100;
  }

  shortDate(date: string): string {
    const parts = date.split(' ');
    return parts.length === 2 ? parts[1] : date;
  }
}
