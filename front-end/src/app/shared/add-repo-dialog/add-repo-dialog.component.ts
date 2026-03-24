import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface AddRepoDialogData {
  sourceName: string;
  provider: string;
}

@Component({
  selector: 'app-add-repo-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  template: `
<div class="dialog-root">
  <div class="dialog-header">
    <div>
      <p class="dialog-eyebrow">{{ data.sourceName }}</p>
      <h2 class="dialog-title">Add Repository</h2>
      <p class="dialog-desc">Connect a repository to monitor for pipeline failures.</p>
    </div>
    <button class="dialog-close" (click)="close()" aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>

  <div class="dialog-fields">
    <div class="field">
      <label class="field-label" for="fullName">
        Repository
        <span class="field-hint">{{ getFormatHint() }}</span>
      </label>
      <input id="fullName" class="field-input" [(ngModel)]="fullName"
        [placeholder]="getPlaceholder()" autocomplete="off" />
    </div>

    <div class="check-group">
      <label class="toggle-label">
        <input type="checkbox" [(ngModel)]="autoAnalyze" />
        <span>Auto-analyze failures</span>
        <span class="field-hint">Background worker will process new failures automatically</span>
      </label>
      <label class="toggle-label">
        <input type="checkbox" [(ngModel)]="autoCreatePr" />
        <span>Auto-create fix PRs</span>
        <span class="field-hint">Create PRs when AI confidence is high enough</span>
      </label>
    </div>
  </div>

  <div class="dialog-footer">
    <button class="btn btn-ghost" (click)="close()">Cancel</button>
    <button class="btn btn-primary" [disabled]="!isValid()" (click)="submit()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      Add Repository
    </button>
  </div>
</div>
  `,
  styles: [`
    .dialog-root { font-family: 'Inter', system-ui, sans-serif; }

    .dialog-header {
      display: flex; align-items: flex-start; gap: 1rem;
      padding: 1.75rem 1.75rem 0;
    }
    .dialog-eyebrow {
      font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.09em; color: #4f46e5; margin: 0 0 0.25rem;
    }
    .dialog-title {
      font-size: 1.25rem; font-weight: 800; letter-spacing: -0.02em;
      color: #111827; margin: 0 0 0.375rem;
    }
    .dialog-desc { font-size: 0.875rem; color: #6b7280; margin: 0; line-height: 1.5; }

    .dialog-close {
      width: 32px; height: 32px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid #e5e7eb; border-radius: 7px;
      background: #f8fafc; color: #6b7280; cursor: pointer;
      margin-top: 2px; margin-left: auto;
      transition: all 150ms ease;
      &:hover { background: #e5e7eb; color: #111827; }
    }

    .dialog-fields {
      display: flex; flex-direction: column; gap: 1rem;
      padding: 1.25rem 1.75rem 0;
    }

    .field { display: flex; flex-direction: column; gap: 0.375rem; }
    .field-label {
      font-size: 0.8125rem; font-weight: 600; color: #111827;
      display: flex; justify-content: space-between; align-items: center;
    }
    .field-hint { font-size: 0.75rem; font-weight: 400; color: #9ca3af; }

    .field-input {
      padding: 0.5625rem 0.875rem;
      border: 1.5px solid #e5e7eb; border-radius: 7px;
      font-size: 0.875rem; font-family: inherit;
      background: #fff; color: #111827; outline: none;
      transition: border-color 150ms ease, box-shadow 150ms ease;
      &::placeholder { color: #9ca3af; }
      &:focus { border-color: #818cf8; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    }

    .check-group {
      display: flex; flex-direction: column; gap: 0.75rem;
      padding: 0.5rem 0;
    }
    .toggle-label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.8125rem; font-weight: 600; color: #111827; cursor: pointer;
    }
    .toggle-label input[type="checkbox"] {
      width: 16px; height: 16px; accent-color: #4f46e5; cursor: pointer;
    }

    .dialog-footer {
      display: flex; justify-content: flex-end; gap: 0.625rem;
      padding: 1.25rem 1.75rem 1.75rem;
      margin-top: 1rem; border-top: 1px solid #f3f4f6;
    }

    .btn {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.5rem 1rem; border-radius: 7px;
      font-size: 0.8125rem; font-weight: 600;
      border: none; cursor: pointer; font-family: inherit;
      transition: all 150ms ease;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-primary {
      background: #4f46e5; color: #fff;
      box-shadow: 0 1px 3px rgba(79,70,229,0.2);
      &:hover:not(:disabled) { background: #3730a3; }
    }
    .btn-ghost {
      background: #f8fafc; color: #111827; border: 1px solid #e5e7eb;
      &:hover { background: #e5e7eb; }
    }
  `]
})
export class AddRepoDialogComponent {
  fullName = '';
  autoAnalyze = true;
  autoCreatePr = true;

  constructor(
    private readonly dialogRef: MatDialogRef<AddRepoDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddRepoDialogData
  ) {}

  getFormatHint(): string {
    switch (this.data.provider) {
      case 'github': return 'Format: owner/repo';
      case 'azure_devops': return 'Format: org/project';
      case 'gitlab': return 'Format: group/project';
      default: return '';
    }
  }

  getPlaceholder(): string {
    switch (this.data.provider) {
      case 'github': return 'e.g. octocat/hello-world';
      case 'azure_devops': return 'e.g. myorg/myproject';
      case 'gitlab': return 'e.g. mygroup/myproject';
      default: return '';
    }
  }

  isValid(): boolean {
    const trimmed = this.fullName.trim();
    return trimmed.length > 0 && trimmed.includes('/');
  }

  submit(): void {
    if (!this.isValid()) return;
    this.dialogRef.close({
      fullName: this.fullName.trim(),
      autoAnalyze: this.autoAnalyze,
      autoCreatePr: this.autoCreatePr,
    });
  }

  close(): void { this.dialogRef.close(); }
}
