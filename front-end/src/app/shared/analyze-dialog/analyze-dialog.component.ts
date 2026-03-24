import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import type { AnalyzeRequest } from '../../core/models/pipeline.model';

@Component({
  selector: 'app-analyze-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  template: `
<div class="dialog-root">

  <!-- Header -->
  <div class="dialog-header">
    <div>
      <p class="dialog-eyebrow">GitHub Actions</p>
      <h2 class="dialog-title">Analyze Pipeline Run</h2>
      <p class="dialog-desc">Enter the repository details and run ID to fetch logs and generate an AI-powered fix.</p>
    </div>
    <button class="dialog-close" (click)="close()" aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>

  <!-- Fields -->
  <div class="dialog-fields">
    <div class="field-row">
      <div class="field">
        <label class="field-label" for="owner">Repository Owner</label>
        <input id="owner" class="field-input" [(ngModel)]="owner" placeholder="e.g. octocat" autocomplete="off" />
      </div>
      <div class="field">
        <label class="field-label" for="repo">Repository Name</label>
        <input id="repo" class="field-input" [(ngModel)]="repo" placeholder="e.g. hello-world" autocomplete="off" />
      </div>
    </div>
    <div class="field">
      <label class="field-label" for="runId">
        Workflow Run ID
        <span class="field-hint">Found in the GitHub Actions URL</span>
      </label>
      <input id="runId" class="field-input" type="number" [(ngModel)]="runId" placeholder="e.g. 9876543210" />
    </div>
  </div>

  <!-- Footer -->
  <div class="dialog-footer">
    <button class="btn btn-ghost" (click)="close()">Cancel</button>
    <button class="btn btn-primary" [disabled]="!isValid()" (click)="submit()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      Analyze Run
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
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }
    @media (max-width: 480px) { .field-row { grid-template-columns: 1fr; } }

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
    /* remove number arrows */
    input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }

    .dialog-footer {
      display: flex; justify-content: flex-end; gap: 0.625rem;
      padding: 1.25rem 1.75rem 1.75rem;
      margin-top: 1rem;
      border-top: 1px solid #f3f4f6;
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
      &:hover:not(:disabled) { background: #3730a3; box-shadow: 0 4px 20px rgba(79,70,229,0.3); transform: translateY(-1px); }
    }
    .btn-ghost {
      background: #f8fafc; color: #111827; border: 1px solid #e5e7eb;
      &:hover { background: #e5e7eb; }
    }
  `]
})
export class AnalyzeDialogComponent {
  owner = '';
  repo = '';
  runId: number | null = null;

  constructor(private readonly dialogRef: MatDialogRef<AnalyzeDialogComponent>) {}

  isValid(): boolean {
    return this.owner.trim().length > 0 && this.repo.trim().length > 0 && !!this.runId && this.runId > 0;
  }

  submit(): void {
    if (!this.isValid()) return;
    const request: AnalyzeRequest = { owner: this.owner.trim(), repo: this.repo.trim(), runId: this.runId! };
    this.dialogRef.close(request);
  }

  close(): void { this.dialogRef.close(); }
}
