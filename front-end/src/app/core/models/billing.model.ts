export type PlanType = 'Free' | 'Pro' | 'Business';
export type PlanStatus = 'Active' | 'Trialing' | 'PastDue' | 'Canceled';

export interface UsageSummary {
  failuresUsed: number;
  failuresLimit: number;   // -1 = unlimited
  reposUsed: number;
  reposLimit: number;      // -1 = unlimited
  membersUsed: number;
  membersLimit: number;    // -1 = unlimited
  autoPrEnabled: boolean;
}

export interface BillingPlan {
  plan: PlanType;
  status: PlanStatus;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId: string | null;
  usage: UsageSummary;
}

export interface PublicPlan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  maxRepos: number;
  maxFailuresPerMonth: number;
  maxMembers: number;
  autoPrEnabled: boolean;
  features: string[];
}
