import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ROUTES } from '../constants/api-routes';
import { DEFAULT_PAGE_SIZE } from '../constants/app-constants';

export interface AdminStats {
  totalOrgs: number;
  planBreakdown: { plan: string; count: number }[];
  totalFailuresThisMonth: number;
  totalAiAnalysesThisMonth: number;
  recentOrgs: { id: string; name: string; slug: string; createdAt: string }[];
}

export interface AdminOrg {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  memberCount: number;
  plan: string;
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface AdminOrgDetail {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  repoCount: number;
  subscription: {
    plan: string;
    status: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
  members: {
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    email: string;
    name: string;
    emailVerified: boolean;
  }[];
  usageHistory: {
    month: string;
    failuresIngested: number;
    aiAnalysesUsed: number;
    reposConnected: number;
    membersCount: number;
  }[];
  recentFailures: {
    id: string;
    repoFullName: string;
    branchName: string | null;
    status: string;
    createdAt: string;
    hasAiAnalysis: boolean;
  }[];
}

export interface AdminSubscription {
  id: string;
  organizationId: string;
  orgName: string;
  orgSlug: string;
  plan: string;
  status: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminFailure {
  id: string;
  organizationId: string | null;
  orgName: string | null;
  repoFullName: string;
  branchName: string | null;
  actorLogin: string | null;
  status: string;
  createdAt: string;
  hasAiAnalysis: boolean;
}

export interface AdminUsageItem {
  organizationId: string;
  orgName: string;
  month: string;
  failuresIngested: number;
  aiAnalysesUsed: number;
  reposConnected: number;
  membersCount: number;
}

export interface PagedResult<T> {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(API_ROUTES.admin.stats);
  }

  getOrganizations(page = 1, pageSize = DEFAULT_PAGE_SIZE, search?: string): Observable<PagedResult<AdminOrg>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (search) params = params.set('search', search);
    return this.http.get<PagedResult<AdminOrg>>(API_ROUTES.admin.organizations, { params });
  }

  getOrganization(id: string): Observable<AdminOrgDetail> {
    return this.http.get<AdminOrgDetail>(API_ROUTES.admin.orgById(id));
  }

  getSubscriptions(page = 1, pageSize = DEFAULT_PAGE_SIZE, plan?: string, status?: string): Observable<PagedResult<AdminSubscription>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (plan) params = params.set('plan', plan);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<AdminSubscription>>(API_ROUTES.admin.subscriptions, { params });
  }

  getFailures(page = 1, pageSize = DEFAULT_PAGE_SIZE, orgId?: string, status?: string): Observable<PagedResult<AdminFailure>> {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (orgId) params = params.set('orgId', orgId);
    if (status) params = params.set('status', status);
    return this.http.get<PagedResult<AdminFailure>>(API_ROUTES.admin.failures, { params });
  }

  getUsage(month?: string): Observable<{ month: string; totals: { totalFailures: number; totalAiAnalyses: number; orgsWithData: number }; items: AdminUsageItem[] }> {
    let params = new HttpParams();
    if (month) params = params.set('month', month);
    return this.http.get<any>(API_ROUTES.admin.usage, { params });
  }
}
