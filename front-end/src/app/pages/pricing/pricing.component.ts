import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { BillingService } from '../../core/services/billing.service';
import { AuthService } from '../../core/services/auth.service';
import { PublicPlan } from '../../core/models/billing.model';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-950 text-white py-16 px-4">

      <!-- Header -->
      <div class="text-center mb-12">
        <div *ngIf="limitReason()" class="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm px-4 py-2 rounded-full mb-6">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
          You've reached your {{ limitLabel() }} limit — upgrade to continue
        </div>
        <h1 class="text-4xl font-bold mb-3">Simple, transparent pricing</h1>
        <p class="text-gray-400 text-lg">Start free. Upgrade when you need more.</p>
      </div>

      <!-- Plan Cards -->
      <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (plan of plans(); track plan.id) {
          <div class="relative rounded-2xl border p-6 flex flex-col"
               [class.border-indigo-500]="plan.id === 'pro'"
               [class.ring-2]="plan.id === 'pro'"
               [class.ring-indigo-500]="plan.id === 'pro'"
               [class.border-gray-700]="plan.id !== 'pro'"
               [class.bg-gray-900]="plan.id !== 'pro'"
               [class.bg-gray-900]="plan.id === 'pro'">

            <!-- Popular badge -->
            @if (plan.id === 'pro') {
              <div class="absolute -top-3 left-1/2 -translate-x-1/2">
                <span class="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
              </div>
            }

            <!-- Plan name & price -->
            <div class="mb-6">
              <h2 class="text-xl font-bold mb-1">{{ plan.name }}</h2>
              <div class="flex items-end gap-1">
                <span class="text-4xl font-bold">
                  <span>&#36;</span>{{ plan.price }}
                </span>
                <span class="text-gray-400 mb-1">/month</span>
              </div>
            </div>

            <!-- Features -->
            <ul class="space-y-3 flex-1 mb-8">
              @for (feature of plan.features; track feature) {
                <li class="flex items-center gap-2 text-sm text-gray-300">
                  <svg class="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ feature }}
                </li>
              }
            </ul>

            <!-- CTA -->
            <button
              (click)="onSelect(plan)"
              [disabled]="loading()"
              class="w-full py-2.5 rounded-lg font-semibold text-sm transition-colors"
              [class.bg-indigo-600]="plan.id === 'pro'"
              [class.hover:bg-indigo-500]="plan.id === 'pro'"
              [class.bg-gray-700]="plan.id !== 'pro'"
              [class.hover:bg-gray-600]="plan.id !== 'pro'"
              [class.opacity-50]="loading() && selectingPlan() === plan.id"
              [class.cursor-not-allowed]="loading() && selectingPlan() === plan.id">
              {{ ctaLabel(plan) }}
            </button>
          </div>
        }
      </div>

      <!-- Back link -->
      <div class="text-center mt-10">
        <button (click)="goBack()" class="text-gray-500 hover:text-gray-300 text-sm transition-colors">
          ← Back to dashboard
        </button>
      </div>

    </div>
  `
})
export class PricingComponent implements OnInit {
  private billing = inject(BillingService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  plans = signal<PublicPlan[]>([]);
  loading = signal(false);
  selectingPlan = signal<string | null>(null);
  limitReason = signal<string | null>(null);

  ngOnInit() {
    this.billing.getPublicPlans().subscribe(p => this.plans.set(p));
    this.route.queryParams.subscribe(params => {
      if (params['reason']) this.limitReason.set(params['reason']);
    });
  }

  limitLabel(): string {
    const map: Record<string, string> = {
      repos: 'repository', members: 'team member',
      failures_per_month: 'monthly failure', auto_pr: 'auto-PR'
    };
    return map[this.limitReason() ?? ''] ?? 'plan';
  }

  ctaLabel(plan: PublicPlan): string {
    if (plan.id === 'free') return 'Get Started Free';
    if (plan.id === 'business') return 'Contact Sales';
    return this.selectingPlan() === plan.id && this.loading() ? 'Redirecting...' : 'Upgrade to Pro';
  }

  onSelect(plan: PublicPlan) {
    if (plan.id === 'free') {
      if (this.auth.currentUser()) this.router.navigate(['/']);
      else this.router.navigate(['/register']);
      return;
    }
    if (plan.id === 'business') {
      window.open('mailto:sales@fixmybuild.io?subject=Business Plan Inquiry', '_blank');
      return;
    }
    if (!this.auth.currentUser()) {
      this.router.navigate(['/register']);
      return;
    }
    this.loading.set(true);
    this.selectingPlan.set(plan.id);
    this.billing.startCheckout(plan.priceId);
  }

  goBack() {
    this.router.navigate([this.auth.currentUser() ? '/' : '/login']);
  }
}
