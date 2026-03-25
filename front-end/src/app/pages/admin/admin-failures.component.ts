import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AdminService, AdminFailure, PagedResult } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-failures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1 class="page-title">Failures</h1>
        <span class="total-badge">{{ result()?.total ?? 0 }} total</span>
      </div>

      <div class="toolbar">
        <input class="search-input" [(ngModel)]="orgIdFilter" (ngModelChange)="onFilterChange()"
               placeholder="Filter by Org ID..." />
        <select class="filter-select" [(ngModel)]="statusFilter" (ngModelChange)="onFilterChange()">
          <option value="">All Statuses</option>
          <option value="failure">Failure</option>
          <option value="success">Success</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else {
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Repository</th>
                <th>Branch</th>
                <th>Actor</th>
                <th>Status</th>
                <th>AI</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              @for (f of result()?.items ?? []; track f.id) {
                <tr>
                  <td class="muted">{{ f.orgName ?? f.organizationId ?? '—' }}</td>
                  <td class="mono-sm">{{ f.repoFullName }}</td>
                  <td class="muted">{{ f.branchName ?? '—' }}</td>
                  <td class="muted">{{ f.actorLogin ?? '—' }}</td>
                  <td><span class="status-badge status-{{ f.status.toLowerCase() }}">{{ f.status }}</span></td>
                  <td>
                    <span [class]="f.hasAiAnalysis ? 'ai-yes' : 'ai-no'">
                      {{ f.hasAiAnalysis ? '✓' : '—' }}
                    </span>
                  </td>
                  <td class="muted">{{ f.createdAt | date:'medium' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button class="page-btn" [disabled]="page === 1" (click)="changePage(page - 1)">← Prev</button>
          <span class="page-info">Page {{ page }} of {{ totalPages() }}</span>
          <button class="page-btn" [disabled]="page >= totalPages()" (click)="changePage(page + 1)">Next →</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { padding: 32px; max-width: 1200px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 700; color: #f1f5f9; margin: 0; }
    .total-badge { background: #334155; color: #94a3b8; font-size: 12px; padding: 3px 10px; border-radius: 20px; }
    .loading { color: #64748b; padding: 40px 0; }

    .toolbar { display: flex; gap: 12px; margin-bottom: 20px; }
    .search-input { background: #1e293b; border: 1px solid #334155; color: #f1f5f9; padding: 10px 14px; border-radius: 8px; font-size: 14px; width: 280px; outline: none; }
    .search-input:focus { border-color: #6366f1; }
    .filter-select { background: #1e293b; border: 1px solid #334155; color: #e2e8f0; padding: 8px 12px; border-radius: 8px; font-size: 14px; outline: none; cursor: pointer; }

    .table-wrap { background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; margin-bottom: 16px; overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; min-width: 900px; }
    .admin-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #334155; white-space: nowrap; }
    .admin-table td { padding: 14px 16px; color: #e2e8f0; font-size: 14px; border-bottom: 1px solid #334155; }
    .admin-table tr:last-child td { border-bottom: none; }
    .muted { color: #64748b; }
    .mono-sm { font-family: monospace; font-size: 12px; }

    .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
    .status-failure { background: rgba(239,68,68,0.15); color: #f87171; }
    .status-success { background: rgba(34,197,94,0.15); color: #4ade80; }
    .status-pending { background: rgba(245,158,11,0.15); color: #fbbf24; }

    .ai-yes { color: #4ade80; }
    .ai-no { color: #334155; }

    .pagination { display: flex; align-items: center; gap: 16px; }
    .page-btn { background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { color: #64748b; font-size: 13px; }
  `]
})
export class AdminFailuresComponent implements OnInit {
  result = signal<PagedResult<AdminFailure> | null>(null);
  loading = signal(true);
  page = 1;
  pageSize = 20;
  orgIdFilter = '';
  statusFilter = '';
  private filterTimer: any;

  constructor(private adminService: AdminService, private route: ActivatedRoute) {}

  ngOnInit() {
    const orgId = this.route.snapshot.queryParamMap.get('orgId');
    if (orgId) this.orgIdFilter = orgId;
    this.load();
  }

  load() {
    this.loading.set(true);
    this.adminService.getFailures(this.page, this.pageSize, this.orgIdFilter || undefined, this.statusFilter || undefined).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onFilterChange() {
    clearTimeout(this.filterTimer);
    this.filterTimer = setTimeout(() => { this.page = 1; this.load(); }, 400);
  }

  changePage(p: number) { this.page = p; this.load(); }

  totalPages(): number {
    const r = this.result();
    return r ? Math.ceil(r.total / this.pageSize) : 1;
  }
}
