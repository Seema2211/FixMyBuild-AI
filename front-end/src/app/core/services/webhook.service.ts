import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import { DEFAULT_PAGE_SIZE } from '../constants/app-constants';

export interface WebhookDelivery {
  id: string;
  event: string;
  statusCode?: number;
  success: boolean;
  attemptCount: number;
  errorMessage?: string;
  createdAt: string;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  hasSecret: boolean;
  createdAt: string;
  recentDeliveries: WebhookDelivery[];
}

export interface CreateWebhookDto {
  name?: string;
  url: string;
  secret?: string;
  events?: string[];
}

@Injectable({ providedIn: 'root' })
export class WebhookService {
  constructor(private http: HttpClient) {}

  list() {
    return firstValueFrom(this.http.get<Webhook[]>(API_ROUTES.webhooks.list));
  }

  create(dto: CreateWebhookDto) {
    return firstValueFrom(this.http.post<Webhook>(API_ROUTES.webhooks.list, dto));
  }

  update(id: string, dto: { name?: string; isActive?: boolean; events?: string[] }) {
    return firstValueFrom(this.http.patch<Webhook>(API_ROUTES.webhooks.byId(id), dto));
  }

  delete(id: string) {
    return firstValueFrom(this.http.delete(API_ROUTES.webhooks.byId(id)));
  }

  deliveries(id: string, page = 1) {
    return firstValueFrom(
      this.http.get<{ total: number; page: number; pageSize: number; items: WebhookDelivery[] }>(
        API_ROUTES.webhooks.deliveries(id, page)
      )
    );
  }

  test(id: string) {
    return firstValueFrom(this.http.post(API_ROUTES.webhooks.test(id), {}));
  }
}
