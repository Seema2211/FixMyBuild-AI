import { Injectable, OnDestroy, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';

export interface SseEvent {
  type: string;
  data: unknown;
}

@Injectable({ providedIn: 'root' })
export class SseService implements OnDestroy {
  private es: EventSource | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  readonly connected = signal(false);
  readonly events$ = new Subject<SseEvent>();

  connect(token: string): void {
    if (this.es) return; // already connected
    this.destroyed = false;
    this.openConnection(token);
  }

  private openConnection(token: string): void {
    if (this.destroyed) return;
    const url = API_ROUTES.pipelines.stream(token);
    this.es = new EventSource(url);

    this.es.onmessage = (ev) => {
      try {
        const parsed = JSON.parse(ev.data) as SseEvent;
        if (parsed.type === 'connected') {
          this.connected.set(true);
        } else {
          this.events$.next(parsed);
        }
      } catch { /* ignore malformed */ }
    };

    this.es.onerror = () => {
      this.connected.set(false);
      this.es?.close();
      this.es = null;
      if (!this.destroyed) {
        // Reconnect after 5s
        this.reconnectTimer = setTimeout(() => this.openConnection(token), 5000);
      }
    };
  }

  disconnect(): void {
    this.destroyed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.es?.close();
    this.es = null;
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
