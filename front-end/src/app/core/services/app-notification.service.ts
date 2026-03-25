import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  total: number;
  unread: number;
  page: number;
  pageSize: number;
  items: AppNotification[];
}

@Injectable({ providedIn: 'root' })
export class AppNotificationService {
  readonly unreadCount = signal(0);
  readonly notifications = signal<AppNotification[]>([]);
  readonly loading = signal(false);

  constructor(private http: HttpClient) {}

  async loadUnreadCount(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ count: number }>(API_ROUTES.notifications.unreadCount)
      );
      this.unreadCount.set(res.count);
    } catch { /* ignore */ }
  }

  async loadNotifications(page = 1): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.get<NotificationsResponse>(API_ROUTES.notifications.list(page))
      );
      this.notifications.set(res.items);
      this.unreadCount.set(res.unread);
    } catch { /* ignore */ } finally {
      this.loading.set(false);
    }
  }

  async markRead(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.patch(API_ROUTES.notifications.markRead(id), {}));
      this.notifications.update(list =>
        list.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      this.unreadCount.update(c => Math.max(0, c - 1));
    } catch { /* ignore */ }
  }

  async markAllRead(): Promise<void> {
    try {
      await firstValueFrom(this.http.patch(API_ROUTES.notifications.markAllRead, {}));
      this.notifications.update(list => list.map(n => ({ ...n, isRead: true })));
      this.unreadCount.set(0);
    } catch { /* ignore */ }
  }

  pushNew(notif: AppNotification): void {
    this.notifications.update(list => [notif, ...list]);
    if (!notif.isRead) {
      this.unreadCount.update(c => c + 1);
    }
  }
}
