import { Component, input } from '@angular/core';
import type { CreatedPullRequest } from '../../core/models/pipeline.model';

@Component({
  selector: 'app-pr-showcase',
  standalone: true,
  imports: [],
  template: `
@if (pr(); as p) {
  <div class="pr-card">
    <div class="pr-header">
      <div class="pr-icon-wrap">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
          <circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 012 2v7M6 9v12"/>
        </svg>
      </div>
      <div>
        <p class="pr-eyebrow">Pull Request Created</p>
        <h3 class="pr-title">{{ p.title }}</h3>
      </div>
      <a [href]="p.htmlUrl" target="_blank" rel="noopener noreferrer" class="pr-view-btn">
        View PR #{{ p.prNumber }}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
    <div class="pr-meta">
      <span class="pr-branch">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 01-9 9"/></svg>
        {{ p.branchName }}
      </span>
    </div>
    @if (p.changesSummary) {
      <div class="pr-expand-wrap" [class.open]="changesOpen">
        <button class="pr-expand-btn" (click)="changesOpen = !changesOpen">
          Changes summary
          <svg class="pr-chevron" [class.open]="changesOpen" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        @if (changesOpen) {
          <pre class="pr-changes">{{ p.changesSummary }}</pre>
        }
      </div>
    }
  </div>
}
  `,
  styles: [`
    .pr-card {
      background: var(--primary-bg);
      border: 1.5px solid #c7d2fe;
      border-radius: var(--radius-md);
      padding: 1.25rem 1.5rem;
      margin-bottom: 1rem;
    }
    .pr-header {
      display: flex; align-items: flex-start; gap: 0.875rem;
      flex-wrap: wrap;
    }
    .pr-icon-wrap {
      width: 38px; height: 38px; flex-shrink: 0;
      border-radius: 7px; background: var(--primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
    }
    .pr-eyebrow { font-size: 0.6875rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; color: var(--primary); margin: 0 0 0.15rem; }
    .pr-title { font-size: 0.9375rem; font-weight: 700; color: var(--text); margin: 0; }

    .pr-view-btn {
      margin-left: auto;
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.4rem 0.875rem;
      background: var(--primary); color: #fff;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem; font-weight: 600;
      text-decoration: none;
      transition: background var(--transition), box-shadow var(--transition), transform var(--transition);
      white-space: nowrap; flex-shrink: 0;
      &:hover { background: var(--primary-dark); box-shadow: var(--shadow-primary); transform: translateY(-1px); }
    }

    .pr-meta { margin-top: 0.75rem; }
    .pr-branch {
      display: inline-flex; align-items: center; gap: 0.3rem;
      font-size: 0.8125rem; font-weight: 500;
      color: var(--primary); font-family: ui-monospace, Menlo, monospace;
      background: rgba(79,70,229,0.08);
      padding: 0.2rem 0.625rem; border-radius: 9999px;
    }

    .pr-expand-wrap { margin-top: 0.875rem; border-top: 1px solid #c7d2fe; padding-top: 0.875rem; }
    .pr-expand-btn {
      display: flex; align-items: center; justify-content: space-between;
      width: 100%; background: none; border: none; cursor: pointer;
      font-size: 0.875rem; font-weight: 600; color: var(--primary); font-family: inherit;
      padding: 0; gap: 0.5rem;
    }
    .pr-chevron { transition: transform var(--transition-slow); flex-shrink: 0; }
    .pr-chevron.open { transform: rotate(180deg); }

    .pr-changes {
      margin: 0.75rem 0 0; padding: 0.875rem 1rem;
      background: rgba(255,255,255,0.6);
      border: 1px solid #c7d2fe;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem; line-height: 1.65;
      white-space: pre-wrap;
      font-family: inherit;
      color: var(--text);
    }
  `]
})
export class PrShowcaseComponent {
  pr = input<CreatedPullRequest | null | undefined>(null);
  changesOpen = false;
}
