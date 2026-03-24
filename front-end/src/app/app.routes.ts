import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/auth/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'verify-email', loadComponent: () => import('./pages/auth/verify-email.component').then(m => m.VerifyEmailComponent) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./pages/dashboard/pipeline-dashboard.component').then(m => m.PipelineDashboardComponent) },
      { path: 'onboarding', loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent) },
      { path: 'pipelines/:id', loadComponent: () => import('./pages/pipeline-details/pipeline-details.component').then(m => m.PipelineDetailsComponent) },
      { path: 'analytics', loadComponent: () => import('./pages/trend-analytics/trend-analytics.component').then(m => m.TrendAnalyticsComponent) },
      { path: 'settings', loadComponent: () => import('./pages/configuration/configuration.component').then(m => m.ConfigurationComponent) },
    ]
  },
  { path: '**', redirectTo: '' },
];
