import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, AdminUsageItem } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-usage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1 class="page-title">Usage Report</h1>
        <input type="month" class="month-input" [(ngModel)]="selectedMonth" (ngModelChange)="load()" />
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else if (data()) {
        <div class="totals-grid">
          <div class="total-card">
            <div class="total-label">Total Failures</div>
            <div class="total-value">{{ data()!.totals.totalFailures | number }}</div>
          </div>
          <div class="total-card">
            <div class="total-label">Total AI Analyses</div>
            <div class="total-value">{{ data()!.totals.totalAiAnalyses | number }}</div>
          </div>
          <div class="total-card">
            <div class="total-label">Active Orgs</div>
            <div class="total-value">{{ data()!.totals.orgsWithData }}</div>
          </div>
        </div>

        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Failures</th>
                <th>AI Analyses</th>
                <th>Repos</th>
                <th>Members</th>
              </tr>
            </thead>
            <tbody>
              @for (u of data()!.items; track u.organizationId) {
                <tr>
                  <td>
                    <div class="org-name">{{ u.orgName }}</div>
                    <div class="org-id">{{ u.organizationId }}</div>
                  </td>
                  <td>
                    <span class="num">{{ u.failuresIngested | number }}</span>
                  </td>
                  <td>
                    <span class="num">{{ u.aiAnalysesUsed | number }}</span>
                  </td>
                  <td class="muted">{{ u.reposConnected }}</td>
                  <td class="muted">{{ u.membersCount }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { padding: 32px; max-width: 1100px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
    .page-title { font-size: 24px; font-weight: 700; color: #f1f5f9; margin: 0; flex: 1; }
    .loading { color: #64748b; padding: 40px 0; }
    .month-input { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; padding: 8px 12px; border-radius: 8px; font-size: 14px; outline: none; }

    .totals-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
    .total-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; }
    .total-label { font-size: 13px; color: #64748b; margin-bottom: 8px; }
    .total-value { font-size: 32px; font-weight: 700; color: #f1f5f9; }

    .table-wrap { background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #334155; }
    .admin-table td { padding: 14px 16px; color: #e2e8f0; font-size: 14px; border-bottom: 1px solid #334155; }
    .admin-table tr:last-child td { border-bottom: none; }
    .org-name { font-weight: 500; }
    .org-id { font-size: 11px; color: #334155; font-family: monospace; margin-top: 2px; }
    .muted { color: #64748b; }
    .num { font-weight: 600; font-variant-numeric: tabular-nums; }
  `]
})
export class AdminUsageComponent implements OnInit {
  data = signal<any>(null);
  loading = signal(true);
  selectedMonth = new Date().toISOString().slice(0, 7);

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminService.getUsage(this.selectedMonth).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
