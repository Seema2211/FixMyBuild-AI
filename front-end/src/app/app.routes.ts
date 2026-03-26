import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { superAdminGuard } from './core/guards/super-admin.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/auth/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'verify-email', loadComponent: () => import('./pages/auth/verify-email.component').then(m => m.VerifyEmailComponent) },
  { path: 'pricing', loadComponent: () => import('./pages/pricing/pricing.component').then(m => m.PricingComponent) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/dashboard/pipeline-dashboard.component').then(m => m.PipelineDashboardComponent) },
      { path: 'onboarding', loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
      { path: 'pipelines/:id', loadComponent: () => import('./pages/pipeline-details/pipeline-details.component').then(m => m.PipelineDetailsComponent) },
      { path: 'analytics', loadComponent: () => import('./pages/trend-analytics/trend-analytics.component').then(m => m.TrendAnalyticsComponent) },
      { path: 'patterns', loadComponent: () => import('./pages/patterns/patterns.component').then(m => m.PatternsComponent) },
      { path: 'settings', loadComponent: () => import('./pages/configuration/configuration.component').then(m => m.ConfigurationComponent) },
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, superAdminGuard],
    loadComponent: () => import('./pages/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./pages/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'organizations', loadComponent: () => import('./pages/admin/admin-organizations.component').then(m => m.AdminOrganizationsComponent) },
      { path: 'organizations/:id', loadComponent: () => import('./pages/admin/admin-org-detail.component').then(m => m.AdminOrgDetailComponent) },
      { path: 'subscriptions', loadComponent: () => import('./pages/admin/admin-subscriptions.component').then(m => m.AdminSubscriptionsComponent) },
      { path: 'failures', loadComponent: () => import('./pages/admin/admin-failures.component').then(m => m.AdminFailuresComponent) },
      { path: 'usage', loadComponent: () => import('./pages/admin/admin-usage.component').then(m => m.AdminUsageComponent) },
    ]
  },
  { path: '**', redirectTo: '' },
];
