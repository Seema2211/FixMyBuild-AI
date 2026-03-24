import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BillingPlan, PublicPlan } from '../models/billing.model';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  getPublicPlans(): Observable<PublicPlan[]> {
    return this.http.get<PublicPlan[]>(`${this.api}/api/billing/plans`);
  }

  getCurrentPlan(): Observable<BillingPlan> {
    return this.http.get<BillingPlan>(`${this.api}/api/billing/plan`);
  }

  startCheckout(priceId: string): void {
    this.http.post<{ url: string }>(`${this.api}/api/billing/checkout`, { priceId })
      .subscribe(res => window.location.href = res.url);
  }

  openBillingPortal(): void {
    this.http.post<{ url: string }>(`${this.api}/api/billing/portal`, {})
      .subscribe(res => window.location.href = res.url);
  }
}
