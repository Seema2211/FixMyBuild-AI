import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-fix-card',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Suggested Fix</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p class="suggestion">{{ fixSuggestion() || '—' }}</p>
        @if (command()) {
          <p class="command-label">Command</p>
          <pre class="command">{{ command() }}</pre>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .suggestion { white-space: pre-wrap; margin-bottom: 1rem; }
    .command-label { font-weight: 500; margin-bottom: 0.25rem; }
    .command {
      margin: 0;
      padding: 0.75rem;
      background: #f5f5f5;
      border-radius: 4px;
      font-size: 13px;
      overflow-x: auto;
    }
  `]
})
export class FixCardComponent {
  fixSuggestion = input<string>('');
  command = input<string>('');
}
