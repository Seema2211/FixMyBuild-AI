import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminService, AdminOrgDetail } from '../../core/services/admin.service';

@Component({
  selector: 'app-admin-org-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <div class="breadcrumb">
        <a routerLink="/admin/organizations" class="bc-link">Organizations</a>
        <span class="bc-sep"> / </span>
        <span class="bc-current">{{ org()?.name ?? 'Loading...' }}</span>
      </div>

      @if (loading()) {
        <div class="loading">Loading...</div>
      } @else if (org()) {
        <div class="page-header">
          <h1 class="page-title">{{ org()!.name }}</h1>
          <span class="slug-badge">{{ org()!.slug }}</span>
          @if (org()!.subscription) {
            <span class="plan-badge" [class]="'plan-' + org()!.subscription!.plan.toLowerCase()">
              {{ org()!.subscription!.plan }}
            </span>
          }
        </div>

        <!-- Subscription Info -->
        <div class="section">
          <h2 class="section-title">Subscription</h2>
          @if (org()!.subscription) {
            <div class="info-grid">
              <div class="info-card">
                <div class="info-label">Plan</div>
                <div class="info-value">{{ org()!.subscription!.plan }}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Status</div>
                <div class="info-value">
                  <span class="status-badge" [class]="'status-' + org()!.subscription!.status.toLowerCase()">
                    {{ org()!.subscription!.status }}
                  </span>
                </div>
              </div>
              <div class="info-card">
                <div class="info-label">Stripe Customer</div>
                <div class="info-value mono">{{ org()!.subscription!.stripeCustomerId ?? '—' }}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Stripe Subscription</div>
                <div class="info-value mono">{{ org()!.subscription!.stripeSubscriptionId ?? '—' }}</div>
              </div>
              <div class="info-card">
                <div class="info-label">Current Period</div>
                <div class="info-value">
                  {{ org()!.subscription!.currentPeriodStart | date:'mediumDate' }} →
                  {{ org()!.subscription!.currentPeriodEnd | date:'mediumDate' }}
                </div>
              </div>
              <div class="info-card">
                <div class="info-label">Cancel at Period End</div>
                <div class="info-value">{{ org()!.subscription!.cancelAtPeriodEnd ? 'Yes' : 'No' }}</div>
              </div>
            </div>
          } @else {
            <div class="empty">No subscription data.</div>
          }
        </div>

        <!-- Usage History -->
        <div class="section">
          <h2 class="section-title">Usage History (Last 12 Months)</h2>
          @if (org()!.usageHistory.length > 0) {
            <div class="table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Failures</th>
                    <th>AI Analyses</th>
                    <th>Repos</th>
                    <th>Members</th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of org()!.usageHistory; track u.month) {
                    <tr>
                      <td class="mono">{{ u.month }}</td>
                      <td>{{ u.failuresIngested | number }}</td>
                      <td>{{ u.aiAnalysesUsed | number }}</td>
                      <td>{{ u.reposConnected }}</td>
                      <td>{{ u.membersCount }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="empty">No usage data yet.</div>
          }
        </div>

        <!-- Members -->
        <div class="section">
          <h2 class="section-title">Members ({{ org()!.members.length }})</h2>
          <div class="table-wrap">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                @for (m of org()!.members; track m.id) {
                  <tr>
                    <td class="font-medium">{{ m.name || '—' }}</td>
                    <td class="muted">{{ m.email }}</td>
                    <td><span class="role-badge role-{{ m.role.toLowerCase() }}">{{ m.role }}</span></td>
                    <td>
                      <span [class]="m.emailVerified ? 'verified' : 'unverified'">
                        {{ m.emailVerified ? '✓ Yes' : '✗ No' }}
                      </span>
                    </td>
                    <td class="muted">{{ m.joinedAt | date:'mediumDate' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Failures -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Recent Failures</h2>
            <a [routerLink]="['/admin/failures']" [queryParams]="{orgId: org()!.id}" class="see-all">See all →</a>
          </div>
          @if (org()!.recentFailures.length > 0) {
            <div class="table-wrap">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Repo</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>AI</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  @for (f of org()!.recentFailures; track f.id) {
                    <tr>
                      <td class="mono-sm">{{ f.repoFullName }}</td>
                      <td class="muted">{{ f.branchName ?? '—' }}</td>
                      <td><span class="status-badge status-{{ f.status.toLowerCase() }}">{{ f.status }}</span></td>
                      <td>{{ f.hasAiAnalysis ? '✓' : '—' }}</td>
                      <td class="muted">{{ f.createdAt | date:'mediumDate' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="empty">No failures recorded.</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { padding: 32px; max-width: 1100px; }
    .breadcrumb { margin-bottom: 20px; font-size: 13px; }
    .bc-link { color: #6366f1; text-decoration: none; }
    .bc-sep { color: #334155; margin: 0 6px; }
    .bc-current { color: #94a3b8; }
    .loading { color: #64748b; padding: 40px 0; }
    .empty { color: #64748b; font-size: 14px; padding: 20px; }

    .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; }
    .page-title { font-size: 24px; font-weight: 700; color: #f1f5f9; margin: 0; }
    .slug-badge { background: #334155; color: #64748b; font-size: 12px; padding: 3px 10px; border-radius: 20px; font-family: monospace; }

    .plan-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
    .plan-free { background: #1e293b; color: #64748b; border: 1px solid #334155; }
    .plan-pro { background: rgba(99,102,241,0.15); color: #818cf8; }
    .plan-business { background: rgba(245,158,11,0.15); color: #fbbf24; }

    .section { margin-bottom: 32px; }
    .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .section-title { font-size: 16px; font-weight: 600; color: #f1f5f9; margin: 0 0 16px; }
    .see-all { color: #6366f1; font-size: 13px; text-decoration: none; }

    .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .info-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; }
    .info-label { font-size: 12px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-value { color: #e2e8f0; font-size: 14px; font-weight: 500; }
    .mono { font-family: monospace; font-size: 12px; word-break: break-all; }

    .table-wrap { background: #1e293b; border: 1px solid #334155; border-radius: 12px; overflow: hidden; }
    .admin-table { width: 100%; border-collapse: collapse; }
    .admin-table th { padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #334155; }
    .admin-table td { padding: 14px 16px; color: #e2e8f0; font-size: 14px; border-bottom: 1px solid #334155; }
    .admin-table tr:last-child td { border-bottom: none; }
    .muted { color: #64748b; }
    .font-medium { font-weight: 500; }
    .mono-sm { font-family: monospace; font-size: 12px; }

    .status-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; }
    .status-active, .status-success { background: rgba(34,197,94,0.15); color: #4ade80; }
    .status-trialing { background: rgba(99,102,241,0.15); color: #818cf8; }
    .status-pastdue, .status-failure { background: rgba(239,68,68,0.15); color: #f87171; }
    .status-canceled { background: rgba(100,116,139,0.15); color: #94a3b8; }

    .role-badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 6px; text-transform: capitalize; }
    .role-admin { background: rgba(99,102,241,0.15); color: #818cf8; }
    .role-developer { background: rgba(34,197,94,0.15); color: #4ade80; }
    .role-viewer { background: rgba(100,116,139,0.15); color: #94a3b8; }

    .verified { color: #4ade80; font-size: 13px; }
    .unverified { color: #f87171; font-size: 13px; }
  `]
})
export class AdminOrgDetailComponent implements OnInit {
  org = signal<AdminOrgDetail | null>(null);
  loading = signal(true);

  constructor(private adminService: AdminService, private route: ActivatedRoute) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.adminService.getOrganization(id).subscribe({
      next: o => { this.org.set(o); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
