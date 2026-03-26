import { Component, input } from '@angular/core';
import { PipelineStagesViewComponent } from '../pipeline-stages-view/pipeline-stages-view.component';
import type { PipelineDetails } from '../../core/models/pipeline.model';
import type { FailurePattern } from '../../core/models/feedback.model';

@Component({
  selector: 'app-pipeline-failure-insight-card',
  standalone: true,
  imports: [PipelineStagesViewComponent],
  template: `
@if (failure(); as f) {
  <div class="insight-card">

    <!-- Header row -->
    <div class="insight-header">
      <div>
        <p class="insight-eyebrow">AI Root-Cause Analysis</p>
        <h2 class="insight-title">Pipeline failure detected</h2>
        @if (f.errorSummary) {
          <p class="insight-summary">{{ f.errorSummary }}</p>
        }
        @if (pattern() && pattern()!.occurrenceCount >= 2) {
          <span class="pattern-badge" title="AI used historical context from similar past failures">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Based on {{ pattern()!.occurrenceCount }} similar past failures
          </span>
        }
      </div>
      <div class="conf-block">
        <span class="conf-label">Confidence</span>
        <span class="conf-value">{{ f.confidence }}%</span>
        <div class="conf-bar-bg">
          <div class="conf-bar-fill" [style.width.%]="f.confidence"></div>
        </div>
      </div>
    </div>

    <!-- Stages -->
    <div class="section">
      <h3 class="section-label">Pipeline stages</h3>
      <app-pipeline-stages-view [failedStage]="f.failedStage || 'Unknown'" [rootCause]="f.rootCause" />
    </div>

    <!-- Two-col grid: root cause + category -->
    <div class="detail-grid">
      <div class="detail-item">
        <h3 class="section-label">Root cause</h3>
        <p class="detail-text">{{ f.rootCause }}</p>
      </div>
      @if (f.category) {
        <div class="detail-item">
          <h3 class="section-label">Category</h3>
          <span class="category-badge">{{ categoryIcon(f.category) }} {{ f.category }}</span>
        </div>
      }
    </div>

    <!-- Fix suggestion -->
    @if (f.fixSuggestion) {
      <div class="section">
        <h3 class="section-label">Suggested fix</h3>
        <div class="fix-suggestion">{{ f.fixSuggestion }}</div>
      </div>
    }

    <!-- Key error lines -->
    @if (f.keyErrorLines && f.keyErrorLines.length > 0) {
      <div class="section">
        <h3 class="section-label">Key error lines</h3>
        <pre class="key-error-block">{{ f.keyErrorLines.join('\n') }}</pre>
      </div>
    }

  </div>
}
  `,
  styles: [`
    .insight-card {
      background: #fff;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    /* Header */
    .insight-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.25rem;
      border-bottom: 1px solid var(--border-light);
    }
    .insight-eyebrow {
      font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.09em; color: var(--primary); margin: 0 0 0.2rem;
    }
    .insight-title { font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em; color: var(--text); margin: 0 0 0.375rem; }
    .insight-summary { font-size: 0.875rem; color: var(--text-muted); margin: 0; line-height: 1.6; max-width: 540px; }
    .pattern-badge {
      display: inline-flex; align-items: center; gap: 0.3rem;
      margin-top: 0.5rem;
      padding: 0.2rem 0.6rem; border-radius: 9999px;
      background: #fef3c7; color: #92400e;
      border: 1px solid #fde68a;
      font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.03em;
    }

    .conf-block { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; flex-shrink: 0; }
    .conf-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
    .conf-value { font-size: 1.25rem; font-weight: 800; color: var(--primary); letter-spacing: -0.03em; }
    .conf-bar-bg { width: 120px; height: 8px; background: var(--border); border-radius: 9999px; overflow: hidden; }
    .conf-bar-fill {
      height: 100%; border-radius: 9999px;
      background: linear-gradient(90deg, var(--primary), var(--primary-light));
      transition: width 0.5s cubic-bezier(0.4,0,0.2,1);
    }

    /* Sections */
    .section { margin-bottom: 1.25rem; }
    .section-label {
      font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.09em; color: var(--text-faint);
      margin: 0 0 0.5rem;
    }

    /* Detail grid */
    .detail-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 1rem; margin-bottom: 1.25rem;
    }
    @media (max-width: 640px) { .detail-grid { grid-template-columns: 1fr; } }
    .detail-item {}
    .detail-text { font-size: 0.9375rem; color: var(--text); margin: 0; line-height: 1.6; }

    .category-badge {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.3rem 0.75rem; border-radius: 9999px;
      border: 1px solid rgba(79,70,229,0.25);
      background: var(--primary-bg);
      font-size: 0.8125rem; font-weight: 600; color: var(--primary);
    }

    /* Fix suggestion */
    .fix-suggestion {
      padding: 1rem 1.25rem;
      background: var(--primary-bg);
      border-left: 3px solid var(--primary);
      border-radius: var(--radius-sm);
      font-size: 0.9375rem;
      color: #312e81;
      white-space: pre-wrap;
      line-height: 1.65;
    }

    /* Key errors */
    .key-error-block {
      margin: 0; padding: 1rem;
      background: #0f172a; color: #fca5a5;
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-family: ui-monospace, 'Cascadia Code', Menlo, monospace;
      overflow-x: auto; max-height: 200px; overflow-y: auto;
      line-height: 1.65; white-space: pre-wrap;
    }
  `]
})
export class PipelineFailureInsightCardComponent {
  failure = input<PipelineDetails | null>(null);
  pattern = input<FailurePattern | null>(null);

  categoryIcon(cat?: string): string {
    switch ((cat || '').toLowerCase()) {
      case 'dependency': return '📦';
      case 'code':       return '💻';
      case 'configuration': return '⚙️';
      case 'test':       return '🧪';
      case 'infrastructure': return '🏗️';
      case 'security':   return '🔒';
      default: return '🔧';
    }
  }
}
