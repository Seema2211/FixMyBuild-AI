import { Component, input } from '@angular/core';

const DEFAULT_STAGES = ['Checkout', 'Install Dependencies', 'Build', 'Test', 'Deploy'];

@Component({
  selector: 'app-pipeline-stages-view',
  standalone: true,
  imports: [],
  template: `
    <div class="stages">
      @for (stage of stages(); track stage; let i = $index) {
        @if (i > 0) { <div class="stage-connector"></div> }
        <div
          class="stage"
          [class.stage-passed]="isBeforeFailed(stage)"
          [class.stage-failed]="isFailed(stage)"
          [class.stage-pending]="!isFailed(stage) && !isBeforeFailed(stage)"
          [title]="isFailed(stage) ? (rootCause() || 'Failed here') : ''"
        >
          <span class="stage-icon">{{ isFailed(stage) ? '✕' : (isBeforeFailed(stage) ? '✓' : '○') }}</span>
          <span class="stage-name">{{ stage }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .stages { display: flex; flex-wrap: wrap; align-items: center; gap: 0; }
    .stage-connector { width: 20px; height: 2px; background: var(--border); flex-shrink: 0; }

    .stage {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.4rem 0.875rem;
      border-radius: 9999px;
      border: 1.5px solid var(--border);
      font-size: 0.8125rem; font-weight: 500;
      transition: all var(--transition);
      white-space: nowrap;
    }
    .stage-passed {
      border-color: var(--success-border);
      background: var(--success-bg);
      color: var(--success);
    }
    .stage-failed {
      border-color: var(--danger-border);
      background: var(--danger-bg);
      color: var(--danger);
      box-shadow: 0 0 0 3px rgba(220,38,38,0.08);
    }
    .stage-pending {
      border-color: var(--border);
      background: var(--bg-subtle);
      color: var(--text-faint);
    }

    .stage-icon { font-size: 0.75rem; font-weight: 800; line-height: 1; }

    @media (max-width: 640px) {
      .stage-connector { display: none; }
      .stages { gap: 0.375rem; }
      .stage { font-size: 0.75rem; padding: 0.35rem 0.625rem; }
    }
  `]
})
export class PipelineStagesViewComponent {
  failedStage = input<string>('');
  rootCause = input<string | null>(null);
  stages = input<string[]>(DEFAULT_STAGES);

  isFailed(stage: string): boolean {
    const failed = (this.failedStage() || '').toLowerCase().trim();
    if (!failed || failed === 'unknown') return false;
    const s = stage.toLowerCase();
    return s.includes(failed) || failed.includes(s);
  }

  isBeforeFailed(stage: string): boolean {
    const list = this.stages();
    const idx = list.indexOf(stage);
    const failedIdx = list.findIndex(s => this.isFailed(s));
    if (failedIdx === -1) return false;
    return idx >= 0 && idx < failedIdx;
  }
}
