import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, AdminOrg, PagedResult } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-organizations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1 class="page-title">Organizations</h1>
        <span class="total-badge">{{ result()?.total ?? 0 }} total</span>
      </div>

      <div class="toolbar">
        <input class="search-input" [(ngModel)]="search" (ngModelChange)="onSearch()"
               placeholder="Search by name or slug..." />
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else {
        <div class="table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Members</th>
                <th>Renews</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (org of result()?.items ?? []; track org.id) {
                <tr>
                  <td>
                    <div class="org-name">{{ org.name }}</div>
                    <div class="org-slug">{{ org.slug }}</div>
                  </td>
                  <td><span class="plan-badge" [class]="'plan-' + org.plan.toLowerCase()">{{ org.plan }}</span></td>
                  <td><span class="status-badge" [class]="'status-' + org.subscriptionStatus.toLowerCase()">{{ org.subscriptionStatus }}</span></td>
                  <td class="muted">{{ org.memberCount }}</td>
                  <td class="muted">{{ org.currentPeriodEnd ? (org.currentPeriodEnd | date:'mediumDate') : '—' }}</td>
                  <td class="muted">{{ org.createdAt | date:'mediumDate' }}</td>
                  <td><a [routerLink]="['/admin/organizations', org.id]" class="link">View →</a></td>
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
    .admin-page { padding: 32px; max-width: 1100px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 700; color: #f1f5f9; margin: 0; }
    .total-badge { background: #334155; color: #94a3b8; font-size: 12px; padding: 3px 10px; border-radius: 20px; }
    .loading { color: #64748b; padding: 40px 0; }

    .toolbar { margin-bottom: 20px; }
    .search-input { background: #1e293b; border: 1px solid #334155; color: #f1f5f9; padding: 10px 14px; border-radius: 8px; font-size: 14px; width: 300px; outline: none; }
    .search-input:focus { border-color: #6366f1; }

    .table-wrap { background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #334155; }
    .admin-table td { padding: 14px 16px; color: #e2e8f0; font-size: 14px; border-bottom: 1px solid #334155; }
    .admin-table tr:last-child td { border-bottom: none; }
    .org-name { font-weight: 500; }
    .org-slug { font-size: 12px; color: #64748b; margin-top: 2px; }
    .muted { color: #64748b; }
    .link { color: #6366f1; text-decoration: none; font-size: 13px; }

    .plan-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
    .plan-free { background: #1e293b; color: #64748b; border: 1px solid #334155; }
    .plan-pro { background: rgba(99,102,241,0.15); color: #818cf8; }
    .plan-business { background: rgba(245,158,11,0.15); color: #fbbf24; }

    .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
    .status-active { background: rgba(34,197,94,0.15); color: #4ade80; }
    .status-trialing { background: rgba(99,102,241,0.15); color: #818cf8; }
    .status-pastdue { background: rgba(245,158,11,0.15); color: #fbbf24; }
    .status-canceled { background: rgba(239,68,68,0.15); color: #f87171; }

    .pagination { display: flex; align-items: center; gap: 16px; }
    .page-btn { background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { color: #64748b; font-size: 13px; }
  `]
})
export class AdminOrganizationsComponent implements OnInit {
  result = signal<PagedResult<AdminOrg> | null>(null);
  loading = signal(true);
  page = 1;
  pageSize = 20;
  search = '';
  private searchTimer: any;

  constructor(private adminService: AdminService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.adminService.getOrganizations(this.page, this.pageSize, this.search || undefined).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 1; this.load(); }, 400);
  }

  changePage(p: number) { this.page = p; this.load(); }

  totalPages(): number {
    const r = this.result();
    return r ? Math.ceil(r.total / this.pageSize) : 1;
  }
}
