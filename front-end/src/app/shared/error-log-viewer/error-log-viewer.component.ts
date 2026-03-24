import { Component, input } from '@angular/core';

@Component({
  selector: 'app-error-log-viewer',
  standalone: true,
  imports: [],
  template: `
    <pre class="log-content">{{ log() || 'No log content available.' }}</pre>
  `,
  styles: [`
    .log-content {
      margin: 0;
      padding: 1rem;
      background: #0f172a;
      color: #e2e8f0;
      border-radius: var(--radius-sm);
      font-size: 11px;
      font-family: ui-monospace, 'Cascadia Code', Menlo, monospace;
      overflow-x: auto;
      max-height: 320px;
      overflow-y: auto;
      line-height: 1.65;
      white-space: pre-wrap;
    }
  `]
})
export class ErrorLogViewerComponent {
  log = input<string>('');
}
