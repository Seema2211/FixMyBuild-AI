import { Component, computed, effect, HostListener, OnDestroy, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SseService } from './core/services/sse.service';
import { AppNotificationService, AppNotification } from './core/services/app-notification.service';
import { DatePipe, NgClass } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, DatePipe, NgClass],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnDestroy {
  readonly year = new Date().getFullYear();
  userMenuOpen = false;
  bellOpen = false;

  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly unreadCount = this.notifService.unreadCount;
  readonly notifications = this.notifService.notifications;
  readonly sseConnected = this.sseService.connected;

  readonly userInitials = computed(() => {
    const u = this.authService.currentUser();
    if (!u) return '';
    return `${u.firstName[0] ?? ''}${u.lastName[0] ?? ''}`.toUpperCase();
  });

  // Toast notifications
  readonly toasts = signal<{ id: string; message: string; type: string }[]>([]);

  private sseSub: Subscription | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly sseService: SseService,
    readonly notifService: AppNotificationService,
  ) {
    // Connect SSE and load notifications when user logs in
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        const token = this.authService.getAccessToken();
        if (token) {
          this.sseService.connect(token);
          this.notifService.loadUnreadCount();
          this.startSseListener();
        }
      } else {
        this.sseService.disconnect();
        this.sseSub?.unsubscribe();
        this.sseSub = null;
      }
    });
  }

  private startSseListener(): void {
    if (this.sseSub) return;
    this.sseSub = this.sseService.events$.subscribe(event => {
      if (event.type === 'failure.created') {
        const d = event.data as Record<string, unknown>;
        this.showToast(
          `Pipeline failure: ${d['pipelineName'] ?? 'Unknown'} — ${d['rootCause'] ?? ''}`,
          'error'
        );
      }
      if (event.type === 'notification') {
        const d = event.data as AppNotification;
        this.notifService.pushNew({ ...d, isRead: false });
      }
    });
  }

  private showToast(message: string, type: string): void {
    const id = crypto.randomUUID();
    this.toasts.update(t => [...t, { id, message, type }]);
    setTimeout(() => {
      this.toasts.update(t => t.filter(x => x.id !== id));
    }, 6000);
  }

  dismissToast(id: string): void {
    this.toasts.update(t => t.filter(x => x.id !== id));
  }

  toggleUserMenu(): void {
    this.userMenuOpen = !this.userMenuOpen;
    if (this.userMenuOpen) this.bellOpen = false;
  }

  toggleBell(): void {
    this.bellOpen = !this.bellOpen;
    if (this.bellOpen) {
      this.userMenuOpen = false;
      this.notifService.loadNotifications();
    }
  }

  markRead(id: string): void {
    this.notifService.markRead(id);
  }

  markAllRead(): void {
    this.notifService.markAllRead();
  }

  navigateNotif(notif: AppNotification): void {
    if (!notif.isRead) this.notifService.markRead(notif.id);
    if (notif.link) this.router.navigateByUrl(notif.link);
    this.bellOpen = false;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) this.userMenuOpen = false;
    if (!target.closest('.bell-menu')) this.bellOpen = false;
  }

  ngOnDestroy(): void {
    this.sseSub?.unsubscribe();
  }
}
