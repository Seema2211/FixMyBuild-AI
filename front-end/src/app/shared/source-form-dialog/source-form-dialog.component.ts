import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import type { PipelineSource } from '../../core/models/config.model';

export interface SourceFormDialogData {
  source?: PipelineSource;
}

@Component({
  selector: 'app-source-form-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  template: `
<div class="dialog-root">
  <div class="dialog-header">
    <div>
      <p class="dialog-eyebrow">Admin Configuration</p>
      <h2 class="dialog-title">{{ isEdit ? 'Edit' : 'Add' }} Pipeline Source</h2>
      <p class="dialog-desc">Connect a CI/CD provider to monitor pipeline failures automatically.</p>
    </div>
    <button class="dialog-close" (click)="close()" aria-label="Close">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>

  <div class="dialog-fields">
    <div class="field">
      <label class="field-label" for="name">Source Name</label>
      <input id="name" class="field-input" [(ngModel)]="name" placeholder="e.g. My GitHub Account" autocomplete="off" />
    </div>

    <div class="field">
      <label class="field-label" for="provider">Provider</label>
      <select id="provider" class="field-input" [(ngModel)]="provider">
        <option value="github">GitHub Actions</option>
        <option value="azure_devops">Azure DevOps</option>
        <option value="gitlab">GitLab CI</option>
      </select>
    </div>

    <div class="field">
      <label class="field-label" for="baseUrl">
        Base URL
        <span class="field-hint">Leave empty for cloud-hosted (github.com, etc.)</span>
      </label>
      <input id="baseUrl" class="field-input" [(ngModel)]="baseUrl"
        [placeholder]="getBaseUrlPlaceholder()" autocomplete="off" />
    </div>

    <div class="field">
      <label class="field-label" for="token">
        Access Token
        <span class="field-hint">{{ isEdit ? 'Leave empty to keep current token' : 'Personal access token or OAuth token' }}</span>
      </label>
      <div class="token-row">
        <input id="token" class="field-input"
          [type]="showToken ? 'text' : 'password'"
          [(ngModel)]="accessToken"
          [placeholder]="isEdit ? '••••••••••••' : 'ghp_xxxx / pat / glpat-xxxx'"
          autocomplete="off" />
        <button class="btn-icon" (click)="showToken = !showToken" type="button" [attr.aria-label]="showToken ? 'Hide' : 'Show'">
          @if (!showToken) {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          } @else {
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
              <line x1="1" y1="1" x2="23" y2="23"/>
            </svg>
          }
        </button>
      </div>
    </div>

    <div class="field-row-check">
      <label class="toggle-label">
        <input type="checkbox" [(ngModel)]="isActive" />
        <span class="toggle-text">Active</span>
        <span class="field-hint">When active, this source will be polled for failures automatically.</span>
      </label>
    </div>
  </div>

  <div class="dialog-footer">
    <button class="btn btn-ghost" (click)="close()">Cancel</button>
    <button class="btn btn-primary" [disabled]="!isValid()" (click)="submit()">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17,21 17,13 7,13 7,21"/><polyline points="7,3 7,8 15,8"/></svg>
      {{ isEdit ? 'Update' : 'Add' }} Source
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

    select.field-input { cursor: pointer; }

    .token-row {
      display: flex; gap: 0.5rem; align-items: stretch;
    }
    .token-row .field-input { flex: 1; }

    .btn-icon {
      width: 38px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid #e5e7eb; border-radius: 7px;
      background: #f8fafc; color: #6b7280; cursor: pointer;
      transition: all 150ms ease;
      &:hover { background: #e5e7eb; color: #111827; }
    }

    .field-row-check {
      padding: 0.5rem 0;
    }
    .toggle-label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.8125rem; font-weight: 600; color: #111827;
      cursor: pointer;
    }
    .toggle-label input[type="checkbox"] {
      width: 16px; height: 16px; accent-color: #4f46e5; cursor: pointer;
    }
    .toggle-text { margin-right: 0.5rem; }

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
export class SourceFormDialogComponent {
  name = '';
  provider = 'github';
  baseUrl = '';
  accessToken = '';
  isActive = true;
  showToken = false;
  isEdit = false;

  constructor(
    private readonly dialogRef: MatDialogRef<SourceFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SourceFormDialogData | null
  ) {
    if (data?.source) {
      this.isEdit = true;
      this.name = data.source.name;
      this.provider = data.source.provider;
      this.baseUrl = data.source.baseUrl ?? '';
      this.isActive = data.source.isActive;
    }
  }

  getBaseUrlPlaceholder(): string {
    switch (this.provider) {
      case 'github': return 'https://github.example.com (optional)';
      case 'azure_devops': return 'https://dev.azure.com/org (optional)';
      case 'gitlab': return 'https://gitlab.example.com (optional)';
      default: return '';
    }
  }

  isValid(): boolean {
    if (!this.name.trim()) return false;
    if (!this.isEdit && !this.accessToken.trim()) return false;
    return true;
  }

  submit(): void {
    if (!this.isValid()) return;
    this.dialogRef.close({
      name: this.name.trim(),
      provider: this.provider,
      baseUrl: this.baseUrl.trim() || undefined,
      accessToken: this.accessToken.trim() || undefined,
      isActive: this.isActive,
    });
  }

  close(): void { this.dialogRef.close(); }
}
