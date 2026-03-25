import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-brand">
          <span class="brand-icon">⚙️</span>
          <div>
            <div class="brand-title">FixMyBuild</div>
            <div class="brand-subtitle">Admin Panel</div>
          </div>
        </div>

        <nav class="admin-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-item">
            <span class="nav-icon">📊</span> Dashboard
          </a>
          <a routerLink="/admin/organizations" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🏢</span> Organizations
          </a>
          <a routerLink="/admin/subscriptions" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💳</span> Subscriptions
          </a>
          <a routerLink="/admin/failures" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🔴</span> Failures
          </a>
          <a routerLink="/admin/usage" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📈</span> Usage Report
          </a>
        </nav>

        <div class="admin-footer">
          <a routerLink="/" class="back-link">← Back to App</a>
        </div>
      </aside>

      <main class="admin-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-shell { display: flex; min-height: 100vh; background: #0f172a; }

    .admin-sidebar {
      width: 240px;
      min-height: 100vh;
      background: #1e293b;
      border-right: 1px solid #334155;
      display: flex;
      flex-direction: column;
      padding: 24px 0;
      flex-shrink: 0;
    }

    .admin-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px 24px;
      border-bottom: 1px solid #334155;
      margin-bottom: 16px;
    }
    .brand-icon { font-size: 24px; }
    .brand-title { font-weight: 700; color: #f1f5f9; font-size: 15px; }
    .brand-subtitle { font-size: 11px; color: #ef4444; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

    .admin-nav { flex: 1; padding: 0 12px; display: flex; flex-direction: column; gap: 4px; }
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      color: #94a3b8;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.15s;
    }
    .nav-item:hover { background: #334155; color: #f1f5f9; }
    .nav-item.active { background: #334155; color: #f1f5f9; }
    .nav-icon { font-size: 16px; }

    .admin-footer { padding: 16px 20px; border-top: 1px solid #334155; margin-top: auto; }
    .back-link { color: #64748b; font-size: 13px; text-decoration: none; }
    .back-link:hover { color: #94a3b8; }

    .admin-content { flex: 1; overflow-y: auto; }
  `]
})
export class AdminLayoutComponent {}
