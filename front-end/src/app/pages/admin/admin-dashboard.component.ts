import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, AdminStats } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1 class="page-title">Platform Overview</h1>
        <span class="admin-badge">Super Admin</span>
      </div>

      @if (loading()) {
        <div class="loading">Loading stats...</div>
      } @else if (stats()) {
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-label">Total Organizations</div>
            <div class="stat-value">{{ stats()!.totalOrgs }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Failures This Month</div>
            <div class="stat-value">{{ stats()!.totalFailuresThisMonth | number }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">AI Analyses This Month</div>
            <div class="stat-value">{{ stats()!.totalAiAnalysesThisMonth | number }}</div>
          </div>
        </div>

        <div class="section">
          <h2 class="section-title">Plan Breakdown</h2>
          <div class="plan-grid">
            @for (p of stats()!.planBreakdown; track p.plan) {
              <div class="plan-card" [class]="'plan-' + p.plan.toLowerCase()">
                <div class="plan-name">{{ p.plan }}</div>
                <div class="plan-count">{{ p.count }}</div>
                <div class="plan-label">organizations</div>
              </div>
            }
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Recent Sign-ups</h2>
            <a routerLink="/admin/organizations" class="see-all">See all →</a>
          </div>
          <div class="table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Slug</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (org of stats()!.recentOrgs; track org.id) {
                  <tr>
                    <td class="org-name">{{ org.name }}</td>
                    <td class="muted">{{ org.slug }}</td>
                    <td class="muted">{{ org.createdAt | date:'mediumDate' }}</td>
                    <td><a [routerLink]="['/admin/organizations', org.id]" class="link">View →</a></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { padding: 32px; max-width: 1100px; }
    .page-header { display: flex; align-items: center; gap: 16px; margin-bottom: 32px; }
    .page-title { font-size: 24px; font-weight: 700; color: #f1f5f9; margin: 0; }
    .admin-badge { background: #dc2626; color: #fff; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.05em; }
    .loading { color: #64748b; padding: 40px 0; }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; }
    .stat-label { font-size: 13px; color: #64748b; margin-bottom: 8px; }
    .stat-value { font-size: 32px; font-weight: 700; color: #f1f5f9; }

    .section { margin-bottom: 32px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .section-title { font-size: 16px; font-weight: 600; color: #f1f5f9; margin: 0 0 16px; }
    .see-all { color: #6366f1; font-size: 13px; text-decoration: none; }

    .plan-grid { display: flex; gap: 16px; }
    .plan-card { flex: 1; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; text-align: center; }
    .plan-name { font-size: 14px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
    .plan-count { font-size: 36px; font-weight: 700; color: #f1f5f9; }
    .plan-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    .plan-card.plan-pro .plan-count { color: #6366f1; }
    .plan-card.plan-business .plan-count { color: #f59e0b; }

    .table-wrap { background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #334155; }
    .admin-table td { padding: 14px 16px; color: #e2e8f0; font-size: 14px; border-bottom: 1px solid #1e293b; }
    .admin-table tr:last-child td { border-bottom: none; }
    .org-name { font-weight: 500; }
    .muted { color: #64748b; }
    .link { color: #6366f1; text-decoration: none; font-size: 13px; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<AdminStats | null>(null);
  loading = signal(true);

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getStats().subscribe({
      next: s => { this.stats.set(s); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
