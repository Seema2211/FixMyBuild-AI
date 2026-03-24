import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../core/services/config.service';
import type { PipelineSource, ConnectedRepository, NotificationSettings, ApiKey, CreateApiKeyResponse } from '../../core/models/config.model';
import { TeamService } from '../../core/services/team.service';
import type { TeamMember, PendingInvitation, CreateInvitationResponse } from '../../core/models/team.model';
import { AuthService } from '../../core/services/auth.service';
import { AuditService } from '../../core/services/audit.service';
import type { AuditEntry } from '../../core/models/audit.model';
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_COLORS } from '../../core/models/audit.model';
import { BillingService } from '../../core/services/billing.service';
import type { BillingPlan } from '../../core/models/billing.model';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { SourceFormDialogComponent } from '../../shared/source-form-dialog/source-form-dialog.component';
import { AddRepoDialogComponent } from '../../shared/add-repo-dialog/add-repo-dialog.component';

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, RouterLink, MatDialogModule, MatSnackBarModule, FormsModule],
  template: `
<!-- ═══ Settings Shell ═══ -->
<div class="settings-shell">

  <!-- ── Hero Banner ── -->
  <div class="settings-hero">
    <div class="hero-bg"></div>
    <div class="hero-content">
      <div class="hero-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </div>
      <div>
        <h1 class="hero-title">Settings</h1>
        <p class="hero-desc">Manage pipeline sources, notifications, and system preferences.</p>
      </div>
    </div>
    <div class="breadcrumb">
      <a routerLink="/" class="breadcrumb-link">Dashboard</a>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
      <span class="breadcrumb-current">Settings</span>
    </div>
  </div>

  <!-- ── Settings Layout ── -->
  <div class="settings-layout">

    <!-- ── Sidebar Tabs ── -->
    <nav class="settings-nav">
      <button class="nav-tab" [class.active]="activeTab === 'sources'" (click)="activeTab = 'sources'">
        <div class="nav-tab-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
        </div>
        <div class="nav-tab-text">
          <span class="nav-tab-label">Pipeline Sources</span>
          <span class="nav-tab-hint">Connect CI/CD providers & repos</span>
        </div>
        @if (sources.length > 0) {
          <span class="nav-tab-count">{{ sources.length }}</span>
        }
      </button>
      <button class="nav-tab" [class.active]="activeTab === 'notifications'" (click)="activeTab = 'notifications'">
        <div class="nav-tab-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>
        <div class="nav-tab-text">
          <span class="nav-tab-label">Notifications</span>
          <span class="nav-tab-hint">Slack, email & alert rules</span>
        </div>
        @if (notifSettings?.slackEnabled || notifSettings?.emailEnabled) {
          <span class="nav-tab-status on"></span>
        }
      </button>
      <button class="nav-tab" [class.active]="activeTab === 'api-keys'" (click)="switchToApiKeys()">
        <div class="nav-tab-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
          </svg>
        </div>
        <div class="nav-tab-text">
          <span class="nav-tab-label">API Keys</span>
          <span class="nav-tab-hint">Generate keys for CI ingest</span>
        </div>
        @if (apiKeys.length > 0) {
          <span class="nav-tab-count">{{ apiKeys.length }}</span>
        }
      </button>
      <button class="nav-tab" [class.active]="activeTab === 'team'" (click)="switchToTeam()">
        <div class="nav-tab-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <div class="nav-tab-text">
          <span class="nav-tab-label">Team</span>
          <span class="nav-tab-hint">Members & invitations</span>
        </div>
        @if (members.length > 0) {
          <span class="nav-tab-count">{{ members.length }}</span>
        }
      </button>
      <button class="nav-tab" [class.active]="activeTab === 'audit'" (click)="switchToAudit()">
        <div class="nav-tab-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div class="nav-tab-text">
          <span class="nav-tab-label">Audit Log</span>
          <span class="nav-tab-hint">Security event history</span>
        </div>
      </button>
      <button class="nav-tab" [class.active]="activeTab === 'billing'" (click)="switchToBilling()">
        <div class="nav-tab-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <div class="nav-tab-text">
          <span class="nav-tab-label">Billing</span>
          <span class="nav-tab-hint">Plan, usage & payments</span>
        </div>
        @if (billingPlan?.plan && billingPlan?.plan !== 'Free') {
          <span class="nav-tab-status on"></span>
        }
      </button>
    </nav>

    <!-- ── Tab Content ── -->
    <div class="settings-content">

      <!-- ════════════ PIPELINE SOURCES TAB ════════════ -->
      @if (activeTab === 'sources') {
        <div class="content-header">
          <div>
            <h2 class="content-title">Pipeline Sources</h2>
            <p class="content-desc">Connect your CI/CD providers and manage repositories to monitor.</p>
          </div>
          <button class="btn btn-primary" (click)="openAddSource()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Source
          </button>
        </div>

        @if (loading) {
          <div class="loading-bar"><div class="loading-bar-inner"></div></div>
        }

        @if (!loading && sources.length === 0) {
          <div class="empty-state">
            <div class="empty-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <h3 class="empty-title">No pipeline sources configured</h3>
            <p class="empty-desc">Add a GitHub, Azure DevOps, or GitLab source to start monitoring your CI/CD pipelines.</p>
            <button class="btn btn-primary" (click)="openAddSource()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Your First Source
            </button>
          </div>
        }

        @for (source of sources; track source.id) {
          <div class="source-card" [class.inactive]="!source.isActive">
            <div class="source-header">
              <div class="source-info">
                <div class="provider-icon" [innerHTML]="getProviderIcon(source.provider)"></div>
                <div>
                  <h3 class="source-name">{{ source.name }}</h3>
                  <div class="source-meta">
                    <span class="provider-badge" [class]="'badge-' + source.provider">{{ getProviderLabel(source.provider) }}</span>
                    <span class="status-dot" [class.active]="source.isActive"></span>
                    <span class="status-text">{{ source.isActive ? 'Active' : 'Inactive' }}</span>
                    @if (source.tokenConfigured) {
                      <span class="token-badge">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        {{ source.maskedToken }}
                      </span>
                    }
                  </div>
                </div>
              </div>
              <div class="source-actions">
                <button class="btn-sm btn-outline" (click)="testConnection(source)" [disabled]="testingSourceId === source.id">
                  @if (testingSourceId === source.id) {
                    <span class="spinner-sm"></span>
                  } @else {
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  }
                  Test
                </button>
                <button class="btn-sm btn-outline" (click)="openEditSource(source)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Edit
                </button>
                <button class="btn-sm btn-danger-outline" (click)="deleteSource(source)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Delete
                </button>
              </div>
            </div>
            <div class="repos-section">
              <div class="repos-header">
                <h4 class="repos-title">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  Repositories
                  <span class="repos-count">{{ source.repositories.length }}</span>
                </h4>
                <button class="btn-sm btn-outline" (click)="openAddRepo(source)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Add Repo
                </button>
              </div>
              @if (source.repositories.length === 0) {
                <p class="repos-empty">No repositories connected. Add one to start monitoring.</p>
              }
              @for (repo of source.repositories; track repo.id) {
                <div class="repo-row" [class.repo-inactive]="!repo.isActive">
                  <div class="repo-info">
                    <span class="repo-name">{{ repo.fullName }}</span>
                    @if (repo.autoAnalyze) { <span class="feature-badge">Auto-analyze</span> }
                    @if (repo.autoCreatePr) { <span class="feature-badge">Auto-PR</span> }
                    @if (!repo.isActive) { <span class="feature-badge badge-muted">Paused</span> }
                  </div>
                  <div class="repo-actions">
                    <button class="btn-icon-sm" (click)="toggleRepo(repo)" [title]="repo.isActive ? 'Pause' : 'Resume'">
                      @if (repo.isActive) {
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                      } @else {
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      }
                    </button>
                    <button class="btn-icon-sm btn-icon-danger" (click)="removeRepo(source, repo)" title="Remove">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- ════════════ NOTIFICATIONS TAB ════════════ -->
      @if (activeTab === 'notifications') {
        <div class="content-header">
          <div>
            <h2 class="content-title">Notifications</h2>
            <p class="content-desc">Configure how and when you get alerted about pipeline failures.</p>
          </div>
        </div>

        @if (notifLoading) {
          <div class="loading-bar"><div class="loading-bar-inner"></div></div>
        }

        @if (!notifLoading && notifSettings) {
          <!-- ── Channels Section ── -->
          <div class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Channels
          </div>

          <!-- Slack -->
          <div class="notif-card" [class.notif-card-enabled]="notifSettings.slackEnabled">
            <div class="notif-card-header" (click)="notifSettings.slackEnabled = !notifSettings.slackEnabled">
              <div class="notif-card-icon slack-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm6.124 2.521a2.528 2.528 0 0 1 2.521-2.521A2.528 2.528 0 0 1 20 8.834a2.528 2.528 0 0 1-2.521 2.521h-2.521V8.834zm-1.272 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 11.165 0a2.528 2.528 0 0 1 2.521 2.522v6.312zm-2.521 6.124a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521v-2.521h2.521zm0-1.272a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.313A2.528 2.528 0 0 1 24 11.165a2.528 2.528 0 0 1-2.522 2.521h-6.313z"/></svg>
              </div>
              <div class="notif-card-text">
                <h3 class="notif-card-title">Slack</h3>
                <p class="notif-card-desc">Post failure alerts to a Slack channel</p>
              </div>
              <label class="toggle-switch" (click)="$event.stopPropagation()">
                <input type="checkbox" [(ngModel)]="notifSettings.slackEnabled">
                <span class="toggle-slider"></span>
              </label>
            </div>
            @if (notifSettings.slackEnabled) {
              <div class="notif-card-body">
                <label class="field-label">Webhook URL</label>
                <div class="input-with-action">
                  <input type="url" class="field-input" placeholder="https://hooks.slack.com/services/T.../B.../xxxx"
                    [(ngModel)]="notifSettings.slackWebhookUrl">
                  <button class="btn-sm btn-test" (click)="testSlack()" [disabled]="testingSlack">
                    @if (testingSlack) { <span class="spinner-sm"></span> } @else {
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    }
                    Send Test
                  </button>
                </div>
                <p class="field-hint">Create an Incoming Webhook in your Slack workspace and paste the URL here.</p>
              </div>
            }
          </div>

          <!-- Email -->
          <div class="notif-card" [class.notif-card-enabled]="notifSettings.emailEnabled">
            <div class="notif-card-header" (click)="notifSettings.emailEnabled = !notifSettings.emailEnabled">
              <div class="notif-card-icon email-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <div class="notif-card-text">
                <h3 class="notif-card-title">Email (SMTP)</h3>
                <p class="notif-card-desc">Send HTML email alerts via your SMTP server</p>
              </div>
              <label class="toggle-switch" (click)="$event.stopPropagation()">
                <input type="checkbox" [(ngModel)]="notifSettings.emailEnabled">
                <span class="toggle-slider"></span>
              </label>
            </div>
            @if (notifSettings.emailEnabled) {
              <div class="notif-card-body">
                <div class="form-grid">
                  <div class="form-group span-2">
                    <label class="field-label">SMTP Host</label>
                    <input type="text" class="field-input" placeholder="smtp.gmail.com" [(ngModel)]="notifSettings.smtpHost">
                  </div>
                  <div class="form-group">
                    <label class="field-label">Port</label>
                    <input type="number" class="field-input" placeholder="587" [(ngModel)]="notifSettings.smtpPort">
                  </div>
                  <div class="form-group span-2">
                    <label class="field-label">Username</label>
                    <input type="text" class="field-input" placeholder="user&#64;example.com" [(ngModel)]="notifSettings.smtpUsername">
                  </div>
                  <div class="form-group">
                    <label class="field-label">Password</label>
                    <input type="password" class="field-input" placeholder="App password" [(ngModel)]="notifSettings.smtpPassword">
                  </div>
                  <div class="form-group span-2">
                    <label class="field-label">From Email</label>
                    <input type="email" class="field-input" placeholder="noreply&#64;fixmybuild.ai" [(ngModel)]="notifSettings.smtpFromEmail">
                  </div>
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="notifSettings.smtpUseSsl">
                      <span>SSL / TLS</span>
                    </label>
                  </div>
                </div>
                <div class="divider"></div>
                <label class="field-label">Send a test email</label>
                <div class="input-with-action">
                  <input type="email" class="field-input" placeholder="your-email&#64;example.com" [(ngModel)]="testEmailRecipient">
                  <button class="btn-sm btn-test" (click)="testEmail()" [disabled]="testingEmail">
                    @if (testingEmail) { <span class="spinner-sm"></span> } @else {
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    }
                    Send Test
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- ── Recipients Section ── -->
          <div class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Recipients
          </div>

          <div class="notif-card notif-card-enabled">
            <div class="notif-card-body">
              <div class="recipient-option">
                <label class="toggle-row">
                  <div class="toggle-row-text">
                    <span class="toggle-row-label">Notify PR author</span>
                    <span class="toggle-row-hint">Dynamically resolves the commit author's email from GitHub / Azure DevOps / GitLab.</span>
                  </div>
                  <label class="toggle-switch">
                    <input type="checkbox" [(ngModel)]="notifSettings.notifyPrAuthor">
                    <span class="toggle-slider"></span>
                  </label>
                </label>
                @if (notifSettings.notifyPrAuthor) {
                  <div class="dynamic-hint">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    Email is extracted from the <code>head_commit.author.email</code> field in the CI run. GitHub noreply addresses are automatically skipped.
                  </div>
                }
              </div>
              <div class="divider"></div>
              <label class="field-label">Additional recipients</label>
              <input type="text" class="field-input" placeholder="team-lead&#64;example.com, ops&#64;example.com"
                [(ngModel)]="notifSettings.additionalRecipients">
              <p class="field-hint">Comma-separated. These addresses always receive alerts regardless of who triggered the pipeline.</p>
            </div>
          </div>

          <!-- ── Severity Filters Section ── -->
          <div class="section-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Severity Filters
          </div>

          <div class="severity-cards">
            <label class="sev-card" [class.sev-active]="notifSettings.notifyOnHigh">
              <input type="checkbox" [(ngModel)]="notifSettings.notifyOnHigh">
              <div class="sev-indicator high"></div>
              <div class="sev-content">
                <span class="sev-label">High</span>
                <span class="sev-desc">Critical failures</span>
              </div>
              <div class="sev-check">
                @if (notifSettings.notifyOnHigh) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                }
              </div>
            </label>
            <label class="sev-card" [class.sev-active]="notifSettings.notifyOnMedium">
              <input type="checkbox" [(ngModel)]="notifSettings.notifyOnMedium">
              <div class="sev-indicator medium"></div>
              <div class="sev-content">
                <span class="sev-label">Medium</span>
                <span class="sev-desc">Standard failures</span>
              </div>
              <div class="sev-check">
                @if (notifSettings.notifyOnMedium) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                }
              </div>
            </label>
            <label class="sev-card" [class.sev-active]="notifSettings.notifyOnLow">
              <input type="checkbox" [(ngModel)]="notifSettings.notifyOnLow">
              <div class="sev-indicator low"></div>
              <div class="sev-content">
                <span class="sev-label">Low</span>
                <span class="sev-desc">Minor issues</span>
              </div>
              <div class="sev-check">
                @if (notifSettings.notifyOnLow) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                }
              </div>
            </label>
          </div>

          <!-- ── Save ── -->
          <div class="save-bar">
            <span class="save-hint">Changes are not saved until you click save.</span>
            <button class="btn btn-primary btn-save" (click)="saveNotificationSettings()" [disabled]="savingNotif">
              @if (savingNotif) { <span class="spinner-sm spinner-white"></span> }
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save Settings
            </button>
          </div>
        }
      }

      <!-- ════════════ API KEYS TAB ════════════ -->
      @if (activeTab === 'api-keys') {
        <div class="content-header">
          <div>
            <h2 class="content-title">API Keys</h2>
            <p class="content-desc">Generate keys to authenticate CI/CD pipeline ingest requests.</p>
          </div>
        </div>

        <!-- New key form -->
        <div class="apikey-form-card">
          <p class="section-label">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Generate New Key
          </p>
          <div class="apikey-form-row">
            <input
              class="field-input apikey-name-input"
              type="text"
              placeholder="e.g. Production CI, Staging"
              [(ngModel)]="newKeyName"
              (keydown.enter)="generateApiKey()"
            />
            <button class="btn btn-primary" (click)="generateApiKey()" [disabled]="generatingKey || !newKeyName.trim()">
              @if (generatingKey) { <span class="spinner-sm spinner-white"></span> }
              @else {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
              }
              Generate Key
            </button>
          </div>
        </div>

        <!-- One-time key reveal -->
        @if (newlyCreatedKey) {
          <div class="apikey-reveal">
            <div class="apikey-reveal-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Copy your key now — it will not be shown again.</span>
            </div>
            <div class="apikey-reveal-body">
              <code class="apikey-value">{{ newlyCreatedKey.rawKey }}</code>
              <button class="btn btn-sm btn-outline" (click)="copyKey(newlyCreatedKey.rawKey)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button class="btn btn-sm btn-outline" (click)="newlyCreatedKey = null">Dismiss</button>
            </div>
          </div>
        }

        @if (apiKeysLoading) {
          <div class="loading-bar"><div class="loading-bar-inner"></div></div>
        }

        @if (!apiKeysLoading && apiKeys.length === 0 && !newlyCreatedKey) {
          <div class="empty-state">
            <div class="empty-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            </div>
            <p class="empty-title">No API keys yet</p>
            <p class="empty-desc">Generate a key above and add it to your CI pipeline to start ingesting failures.</p>
          </div>
        }

        @if (!apiKeysLoading && apiKeys.length > 0) {
          <div class="apikey-list">
            @for (key of apiKeys; track key.id) {
              <div class="apikey-row">
                <div class="apikey-row-info">
                  <div class="apikey-row-name">{{ key.name }}</div>
                  <code class="apikey-prefix">{{ key.keyPrefix }}…</code>
                  <span class="apikey-meta">Created {{ formatDate(key.createdAt) }}</span>
                  @if (key.lastUsedAt) {
                    <span class="apikey-meta">· Last used {{ formatDate(key.lastUsedAt) }}</span>
                  } @else {
                    <span class="apikey-meta apikey-unused">· Never used</span>
                  }
                </div>
                <button class="btn-icon-sm btn-icon-danger" title="Revoke key" (click)="revokeApiKey(key)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                </button>
              </div>
            }
          </div>
        }

        <!-- CI Integration Snippet -->
        <p class="section-label" style="margin-top:2rem">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          CI Integration
        </p>
        <div class="snippet-card">
          <div class="snippet-card-header">
            <span class="snippet-lang">GitHub Actions</span>
            <button class="btn btn-sm btn-outline" (click)="copySnippet('github')">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy
            </button>
          </div>
          <pre class="snippet-code">{{ githubSnippet }}</pre>
        </div>
        <div class="snippet-card">
          <div class="snippet-card-header">
            <span class="snippet-lang">GitLab CI</span>
            <button class="btn btn-sm btn-outline" (click)="copySnippet('gitlab')">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy
            </button>
          </div>
          <pre class="snippet-code">{{ gitlabSnippet }}</pre>
        </div>
        <div class="snippet-card">
          <div class="snippet-card-header">
            <span class="snippet-lang">Azure DevOps</span>
            <button class="btn btn-sm btn-outline" (click)="copySnippet('azure')">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Copy
            </button>
          </div>
          <pre class="snippet-code">{{ azureSnippet }}</pre>
        </div>
      }

      <!-- ════════════ TEAM TAB ════════════ -->
      @if (activeTab === 'team') {
        <div class="content-header">
          <div>
            <h2 class="content-title">Team</h2>
            <p class="content-desc">Manage members and invite your teammates.</p>
          </div>
        </div>

        <!-- Invite form (admin only) -->
        @if (isAdmin()) {
          <div class="apikey-form-card">
            <p class="section-label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Invite a Teammate
            </p>
            <div class="invite-form-row">
              <input class="field-input" type="email" placeholder="teammate@company.com"
                [(ngModel)]="inviteEmail" />
              <select class="field-input invite-role-select" [(ngModel)]="inviteRole">
                <option value="developer">Developer</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
              <button class="btn btn-primary" (click)="sendInvite()" [disabled]="sendingInvite || !inviteEmail.trim()">
                @if (sendingInvite) { <span class="spinner-sm spinner-white"></span> }
                @else {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                }
                Send Invite
              </button>
            </div>
          </div>
        }

        <!-- Invite link reveal -->
        @if (newInviteLink) {
          <div class="apikey-reveal">
            <div class="apikey-reveal-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              <span>Share this invite link — expires in 7 days.</span>
            </div>
            <div class="apikey-reveal-body">
              <code class="apikey-value">{{ newInviteLink }}</code>
              <button class="btn btn-sm btn-outline" (click)="copyKey(newInviteLink)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button class="btn btn-sm btn-outline" (click)="newInviteLink = ''">Dismiss</button>
            </div>
          </div>
        }

        <!-- Members list -->
        <p class="section-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          Members ({{ members.length }})
        </p>

        @if (teamLoading) {
          <div class="loading-bar"><div class="loading-bar-inner"></div></div>
        }

        <div class="team-list">
          @for (member of members; track member.id) {
            <div class="team-row">
              <div class="team-avatar">{{ member.user.firstName[0] }}{{ member.user.lastName[0] }}</div>
              <div class="team-info">
                <div class="team-name">{{ member.user.firstName }} {{ member.user.lastName }}</div>
                <div class="team-email">{{ member.user.email }}</div>
              </div>
              @if (isAdmin() && member.userId !== currentUserId()) {
                <select class="role-select" [value]="member.role"
                  (change)="changeRole(member, $any($event.target).value)">
                  <option value="admin">Admin</option>
                  <option value="developer">Developer</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button class="btn-icon-sm btn-icon-danger" title="Remove member"
                  (click)="removeMember(member)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                </button>
              } @else {
                <span class="role-badge role-{{ member.role }}">{{ member.role }}</span>
              }
            </div>
          }
        </div>

        <!-- Pending invitations -->
        @if (pendingInvites.length > 0) {
          <p class="section-label" style="margin-top:1.75rem">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Pending Invitations ({{ pendingInvites.length }})
          </p>
          <div class="team-list">
            @for (inv of pendingInvites; track inv.id) {
              <div class="team-row" [class.expired]="inv.isExpired">
                <div class="team-avatar pending-avatar">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </div>
                <div class="team-info">
                  <div class="team-name">{{ inv.email }}</div>
                  <div class="team-email">Invited by {{ inv.invitedBy }} · {{ inv.isExpired ? 'Expired' : 'Expires ' + formatDate(inv.expiresAt) }}</div>
                </div>
                <span class="role-badge role-{{ inv.role }}">{{ inv.role }}</span>
                @if (isAdmin()) {
                  <button class="btn-icon-sm btn-icon-danger" title="Revoke invitation"
                    (click)="revokeInvite(inv)">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                }
              </div>
            }
          </div>
        }
      }

      <!-- ════════════ AUDIT LOG TAB ════════════ -->
      @if (activeTab === 'audit') {
        <div class="content-header">
          <div>
            <h2 class="content-title">Audit Log</h2>
            <p class="content-desc">Security events for your organization — logins, role changes, invites, and API keys.</p>
          </div>
        </div>

        @if (auditLoading) {
          <div class="loading-bar"><div class="loading-bar-inner"></div></div>
        }

        @if (!auditLoading && auditLogs.length === 0) {
          <div class="empty-state">
            <div class="empty-icon-wrap">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <h3 class="empty-title">No events yet</h3>
            <p class="empty-desc">Security events will appear here as your team logs in, invites members, and manages API keys.</p>
          </div>
        }

        @if (!auditLoading && auditLogs.length > 0) {
          <div class="audit-table-wrap">
            <table class="audit-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Actor</th>
                  <th>Target / Details</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                @for (entry of auditLogs; track entry.id) {
                  <tr>
                    <td>
                      <span class="audit-badge audit-{{ getAuditColor(entry.action) }}">
                        {{ getAuditLabel(entry.action) }}
                      </span>
                    </td>
                    <td class="audit-email">{{ entry.actorEmail ?? '—' }}</td>
                    <td class="audit-detail">{{ entry.targetEmail ?? entry.details ?? '—' }}</td>
                    <td class="audit-time">{{ formatDateTime(entry.createdAt) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (auditTotal > auditPageSize) {
            <div class="audit-pagination">
              <button class="btn-sm btn-outline" [disabled]="auditPage <= 1" (click)="auditPageChange(-1)">← Prev</button>
              <span class="audit-page-info">Page {{ auditPage }} of {{ auditTotalPages() }}</span>
              <button class="btn-sm btn-outline" [disabled]="auditPage >= auditTotalPages()" (click)="auditPageChange(1)">Next →</button>
            </div>
          }
        }
      }

      <!-- ════════════ BILLING TAB ════════════ -->
      @if (activeTab === 'billing') {
        <div class="content-header">
          <div>
            <h2 class="content-title">Billing & Plan</h2>
            <p class="content-desc">Manage your subscription, usage, and payment details.</p>
          </div>
        </div>

        @if (billingLoading) {
          <div class="loading-bar"><div class="loading-bar-inner"></div></div>
        }

        @if (!billingLoading && billingPlan) {
          <!-- Current Plan Card -->
          <div class="billing-plan-card">
            <div class="billing-plan-header">
              <div>
                <div class="billing-plan-name">
                  <span class="plan-badge plan-{{ billingPlan.plan.toLowerCase() }}">{{ billingPlan.plan }}</span>
                  @if (billingPlan.status === 'PastDue') {
                    <span class="status-badge status-warning">Payment Due</span>
                  }
                  @if (billingPlan.cancelAtPeriodEnd) {
                    <span class="status-badge status-danger">Cancels {{ formatBillingDate(billingPlan.currentPeriodEnd) }}</span>
                  }
                </div>
                @if (billingPlan.currentPeriodEnd && billingPlan.plan !== 'Free') {
                  <p class="billing-renewal">Renews {{ formatBillingDate(billingPlan.currentPeriodEnd) }}</p>
                }
              </div>
              <div class="billing-plan-actions">
                @if (billingPlan.plan === 'Free') {
                  <a routerLink="/pricing" class="btn btn-primary">Upgrade Plan</a>
                } @else {
                  <button class="btn btn-outline" (click)="openBillingPortal()">Manage Billing</button>
                  <a routerLink="/pricing" class="btn btn-ghost">Change Plan</a>
                }
              </div>
            </div>
          </div>

          <!-- Usage Meters -->
          <div class="billing-usage-section">
            <h3 class="usage-title">Current Usage</h3>
            <div class="usage-grid">

              <!-- Failures -->
              <div class="usage-card">
                <div class="usage-card-header">
                  <span class="usage-label">Failures this month</span>
                  <span class="usage-value">
                    {{ billingPlan.usage.failuresUsed }}
                    / {{ billingPlan.usage.failuresLimit === -1 ? '∞' : billingPlan.usage.failuresLimit }}
                  </span>
                </div>
                @if (billingPlan.usage.failuresLimit !== -1) {
                  <div class="usage-bar-wrap">
                    <div class="usage-bar" [style.width.%]="usagePct(billingPlan.usage.failuresUsed, billingPlan.usage.failuresLimit)"
                         [class.usage-bar-warn]="usagePct(billingPlan.usage.failuresUsed, billingPlan.usage.failuresLimit) >= 80"
                         [class.usage-bar-danger]="usagePct(billingPlan.usage.failuresUsed, billingPlan.usage.failuresLimit) >= 100"></div>
                  </div>
                }
              </div>

              <!-- Repos -->
              <div class="usage-card">
                <div class="usage-card-header">
                  <span class="usage-label">Repositories</span>
                  <span class="usage-value">
                    {{ billingPlan.usage.reposUsed }}
                    / {{ billingPlan.usage.reposLimit === -1 ? '∞' : billingPlan.usage.reposLimit }}
                  </span>
                </div>
                @if (billingPlan.usage.reposLimit !== -1) {
                  <div class="usage-bar-wrap">
                    <div class="usage-bar" [style.width.%]="usagePct(billingPlan.usage.reposUsed, billingPlan.usage.reposLimit)"
                         [class.usage-bar-warn]="usagePct(billingPlan.usage.reposUsed, billingPlan.usage.reposLimit) >= 80"
                         [class.usage-bar-danger]="usagePct(billingPlan.usage.reposUsed, billingPlan.usage.reposLimit) >= 100"></div>
                  </div>
                }
              </div>

              <!-- Members -->
              <div class="usage-card">
                <div class="usage-card-header">
                  <span class="usage-label">Team members</span>
                  <span class="usage-value">
                    {{ billingPlan.usage.membersUsed }}
                    / {{ billingPlan.usage.membersLimit === -1 ? '∞' : billingPlan.usage.membersLimit }}
                  </span>
                </div>
                @if (billingPlan.usage.membersLimit !== -1) {
                  <div class="usage-bar-wrap">
                    <div class="usage-bar" [style.width.%]="usagePct(billingPlan.usage.membersUsed, billingPlan.usage.membersLimit)"
                         [class.usage-bar-warn]="usagePct(billingPlan.usage.membersUsed, billingPlan.usage.membersLimit) >= 80"
                         [class.usage-bar-danger]="usagePct(billingPlan.usage.membersUsed, billingPlan.usage.membersLimit) >= 100"></div>
                  </div>
                }
              </div>

              <!-- AI Analyses -->
              <div class="usage-card">
                <div class="usage-card-header">
                  <span class="usage-label">AI analyses this month</span>
                  <span class="usage-value">
                    {{ billingPlan.usage.aiAnalysesUsed }}
                    / {{ billingPlan.usage.aiAnalysesLimit === -1 ? '∞' : billingPlan.usage.aiAnalysesLimit }}
                  </span>
                </div>
                @if (billingPlan.usage.aiAnalysesLimit !== -1) {
                  <div class="usage-bar-wrap">
                    <div class="usage-bar" [style.width.%]="usagePct(billingPlan.usage.aiAnalysesUsed, billingPlan.usage.aiAnalysesLimit)"
                         [class.usage-bar-warn]="usagePct(billingPlan.usage.aiAnalysesUsed, billingPlan.usage.aiAnalysesLimit) >= 80"
                         [class.usage-bar-danger]="usagePct(billingPlan.usage.aiAnalysesUsed, billingPlan.usage.aiAnalysesLimit) >= 100"></div>
                  </div>
                }
              </div>

              <!-- Feature flags -->
              <div class="usage-card">
                <div class="usage-card-header">
                  <span class="usage-label">Failure history</span>
                  <span class="usage-value">
                    {{ billingPlan.usage.failureHistoryDays === -1 ? 'Unlimited' : billingPlan.usage.failureHistoryDays + ' days' }}
                  </span>
                </div>
              </div>

              <div class="usage-card">
                <div class="feature-flag-grid">
                  <div class="feature-flag-row">
                    <span class="usage-label">AI Auto-PR</span>
                    <span [class.feature-on]="billingPlan.usage.autoPrEnabled" [class.feature-off]="!billingPlan.usage.autoPrEnabled">
                      {{ billingPlan.usage.autoPrEnabled ? 'Enabled' : 'Pro+' }}
                    </span>
                  </div>
                  <div class="feature-flag-row">
                    <span class="usage-label">Analytics</span>
                    <span [class.feature-on]="billingPlan.usage.analyticsEnabled" [class.feature-off]="!billingPlan.usage.analyticsEnabled">
                      {{ billingPlan.usage.analyticsEnabled ? 'Enabled' : 'Pro+' }}
                    </span>
                  </div>
                  <div class="feature-flag-row">
                    <span class="usage-label">Audit log</span>
                    <span [class.feature-on]="billingPlan.usage.auditLogEnabled" [class.feature-off]="!billingPlan.usage.auditLogEnabled">
                      {{ billingPlan.usage.auditLogEnabled ? 'Enabled' : 'Pro+' }}
                    </span>
                  </div>
                  <div class="feature-flag-row">
                    <span class="usage-label">Notifications</span>
                    <span [class.feature-on]="billingPlan.usage.notificationsEnabled" [class.feature-off]="!billingPlan.usage.notificationsEnabled">
                      {{ billingPlan.usage.notificationsEnabled ? 'Enabled' : 'Pro+' }}
                    </span>
                  </div>
                </div>
                @if (!billingPlan.usage.autoPrEnabled) {
                  <a routerLink="/pricing" class="upgrade-hint" style="margin-top:0.75rem;display:block">Upgrade to Pro to unlock all features →</a>
                }
              </div>

            </div>
          </div>
        }
      }

    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; }

    /* ═══ Hero Banner ═══ */
    .settings-hero {
      position: relative;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
      border-radius: 16px;
      padding: 2rem 2rem 1.5rem;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse 600px 300px at 80% 20%, rgba(99,102,241,0.2), transparent),
        radial-gradient(ellipse 400px 200px at 20% 80%, rgba(168,85,247,0.15), transparent);
      pointer-events: none;
    }
    .hero-content {
      position: relative;
      display: flex; align-items: center; gap: 1rem;
      margin-bottom: 1rem;
    }
    .hero-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,0.85); flex-shrink: 0;
    }
    .hero-title {
      font-size: 1.75rem; font-weight: 800; color: #fff;
      letter-spacing: -0.03em; margin: 0 0 0.25rem;
    }
    .hero-desc {
      font-size: 0.9375rem; color: rgba(255,255,255,0.55); margin: 0;
    }
    .breadcrumb {
      position: relative;
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.75rem; color: rgba(255,255,255,0.35);
    }
    .breadcrumb-link {
      color: rgba(255,255,255,0.45); text-decoration: none;
      &:hover { color: rgba(255,255,255,0.8); }
    }
    .breadcrumb-current { color: rgba(255,255,255,0.7); font-weight: 600; }

    /* ═══ Settings Layout ═══ */
    .settings-layout {
      display: grid;
      grid-template-columns: 260px 1fr;
      gap: 1.5rem;
      align-items: flex-start;
    }
    @media (max-width: 900px) {
      .settings-layout { grid-template-columns: 1fr; }
    }

    /* ═══ Sidebar Nav ═══ */
    .settings-nav {
      position: sticky; top: 76px;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 0.5rem;
      display: flex; flex-direction: column; gap: 0.25rem;
    }
    @media (max-width: 900px) {
      .settings-nav {
        position: static; flex-direction: row;
      }
    }
    .nav-tab {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.875rem 1rem; border-radius: 10px;
      border: none; background: transparent;
      cursor: pointer; font-family: inherit;
      text-align: left; width: 100%;
      transition: all 150ms ease;
      &:hover { background: #f8fafc; }
      &.active {
        background: linear-gradient(135deg, #eef2ff, #ede9fe);
        box-shadow: 0 0 0 1.5px #c7d2fe;
      }
    }
    @media (max-width: 900px) {
      .nav-tab { flex: 1; justify-content: center; }
      .nav-tab-hint { display: none; }
    }
    .nav-tab-icon {
      width: 36px; height: 36px; border-radius: 9px;
      background: #f1f5f9; color: #6b7280;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: all 150ms ease;
    }
    .nav-tab.active .nav-tab-icon {
      background: #4f46e5; color: white;
    }
    .nav-tab-text { display: flex; flex-direction: column; min-width: 0; }
    .nav-tab-label {
      font-size: 0.875rem; font-weight: 700; color: #111827;
    }
    .nav-tab-hint {
      font-size: 0.6875rem; color: #9ca3af; margin-top: 1px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .nav-tab-count {
      margin-left: auto;
      padding: 2px 8px; border-radius: 99px;
      font-size: 0.6875rem; font-weight: 700;
      background: #f1f5f9; color: #6b7280;
    }
    .nav-tab.active .nav-tab-count {
      background: #4f46e5; color: white;
    }
    .nav-tab-status {
      margin-left: auto;
      width: 8px; height: 8px; border-radius: 50%;
      background: #d1d5db;
      &.on { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,0.15); }
    }

    /* ═══ Content Area ═══ */
    .settings-content { min-width: 0; }
    .content-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .content-title {
      font-size: 1.375rem; font-weight: 800; color: #111827;
      letter-spacing: -0.02em; margin: 0 0 0.25rem;
    }
    .content-desc { font-size: 0.875rem; color: #6b7280; margin: 0; }

    /* ═══ Section Labels ═══ */
    .section-label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.6875rem; font-weight: 800; text-transform: uppercase;
      letter-spacing: 0.08em; color: #9ca3af;
      margin: 1.75rem 0 0.75rem; padding-bottom: 0.5rem;
      border-bottom: 1px solid #f1f5f9;
    }

    /* ═══ Buttons ═══ */
    .btn {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.5625rem 1.125rem; border-radius: 10px;
      font-size: 0.8125rem; font-weight: 600;
      border: none; cursor: pointer; font-family: inherit;
      transition: all 180ms ease;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-primary {
      background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff;
      box-shadow: 0 2px 8px rgba(79,70,229,0.25);
      &:hover:not(:disabled) { box-shadow: 0 4px 20px rgba(79,70,229,0.35); transform: translateY(-1px); }
    }
    .btn-save { padding: 0.625rem 1.5rem; }
    .btn-sm {
      display: inline-flex; align-items: center; gap: 0.25rem;
      padding: 0.375rem 0.75rem; border-radius: 8px;
      font-size: 0.75rem; font-weight: 600;
      border: none; cursor: pointer; font-family: inherit;
      transition: all 150ms ease;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .btn-outline {
      background: white; color: #374151;
      border: 1.5px solid #e5e7eb;
      &:hover:not(:disabled) { background: #f9fafb; border-color: #d1d5db; }
    }
    .btn-danger-outline {
      background: white; color: #dc2626;
      border: 1.5px solid #fecaca;
      &:hover:not(:disabled) { background: #fef2f2; border-color: #f87171; }
    }
    .btn-test {
      background: #f0f4ff; color: #4f46e5;
      border: 1.5px solid #c7d2fe;
      flex-shrink: 0;
      &:hover:not(:disabled) { background: #e0e7ff; }
    }
    .btn-icon-sm {
      width: 28px; height: 28px;
      display: flex; align-items: center; justify-content: center;
      border: 1.5px solid #e5e7eb; border-radius: 7px;
      background: white; color: #6b7280; cursor: pointer;
      transition: all 150ms ease;
      &:hover { background: #f3f4f6; color: #111827; }
    }
    .btn-icon-danger { &:hover { background: #fef2f2; color: #dc2626; border-color: #fecaca; } }

    /* ═══ Loading ═══ */
    .loading-bar {
      height: 3px; background: #e5e7eb; border-radius: 2px;
      overflow: hidden; margin-bottom: 1.5rem;
    }
    .loading-bar-inner {
      height: 100%; width: 40%; background: linear-gradient(90deg, #4f46e5, #a855f7);
      border-radius: 2px; animation: loadSlide 1.2s ease-in-out infinite;
    }
    @keyframes loadSlide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }
    .spinner-sm {
      width: 12px; height: 12px;
      border: 2px solid #e5e7eb; border-top-color: #4f46e5;
      border-radius: 50%; animation: spin 0.6s linear infinite;
    }
    .spinner-white { border-color: rgba(255,255,255,0.3); border-top-color: white; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ═══ Empty State ═══ */
    .empty-state {
      text-align: center; padding: 3.5rem 2rem;
      background: #f8fafc; border: 2px dashed #e2e8f0;
      border-radius: 16px;
    }
    .empty-icon-wrap {
      width: 72px; height: 72px; margin: 0 auto 1.25rem;
      background: #f0f4ff; border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      color: #a5b4fc;
    }
    .empty-title { font-size: 1.0625rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem; }
    .empty-desc { font-size: 0.875rem; color: #6b7280; margin: 0 0 1.5rem; max-width: 380px; margin-left: auto; margin-right: auto; }

    /* ═══ Source Cards ═══ */
    .source-card {
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 14px; margin-bottom: 1rem; overflow: hidden;
      transition: border-color 150ms ease, box-shadow 150ms ease;
      &:hover { border-color: #c7d2fe; box-shadow: 0 4px 24px rgba(79,70,229,0.06); }
      &.inactive { opacity: 0.65; }
    }
    .source-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.125rem 1.25rem; gap: 1rem; flex-wrap: wrap;
      border-bottom: 1px solid #f1f5f9;
    }
    .source-info { display: flex; align-items: center; gap: 0.75rem; }
    .provider-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      background: #f0f4ff; flex-shrink: 0;
    }
    .source-name { font-size: 0.9375rem; font-weight: 700; color: #111827; margin: 0 0 0.25rem; }
    .source-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .provider-badge {
      padding: 2px 8px; border-radius: 99px;
      font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .badge-github { background: #f0f4ff; color: #4f46e5; }
    .badge-azure_devops { background: #eff6ff; color: #2563eb; }
    .badge-gitlab { background: #fef3c7; color: #d97706; }
    .status-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #d1d5db;
      &.active { background: #22c55e; }
    }
    .status-text { font-size: 0.6875rem; font-weight: 600; color: #6b7280; }
    .token-badge {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px; border-radius: 99px;
      font-size: 0.625rem; font-weight: 500;
      background: #f8fafc; color: #9ca3af; border: 1px solid #e5e7eb;
      font-family: ui-monospace, monospace;
    }
    .source-actions { display: flex; gap: 0.375rem; flex-wrap: wrap; }

    /* ── Repos ── */
    .repos-section { padding: 0.875rem 1.25rem 1rem; }
    .repos-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.5rem;
    }
    .repos-title {
      display: flex; align-items: center; gap: 0.375rem;
      font-size: 0.75rem; font-weight: 700; color: #6b7280; margin: 0;
    }
    .repos-count {
      padding: 1px 6px; border-radius: 99px; background: #f1f5f9;
      font-size: 0.625rem; font-weight: 700; color: #6b7280;
    }
    .repos-empty { font-size: 0.8125rem; color: #9ca3af; font-style: italic; margin: 0; padding: 0.5rem 0; }
    .repo-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.5rem 0.625rem; border-radius: 8px;
      transition: background 150ms ease;
      &:hover { background: #f8fafc; }
      &.repo-inactive { opacity: 0.55; }
    }
    .repo-info { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .repo-name { font-size: 0.8125rem; font-weight: 600; color: #111827; font-family: ui-monospace, monospace; }
    .feature-badge {
      padding: 1px 6px; border-radius: 4px;
      font-size: 0.5625rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em; background: #eef2ff; color: #4f46e5;
    }
    .badge-muted { background: #f3f4f6; color: #9ca3af; }
    .repo-actions { display: flex; gap: 0.25rem; }

    /* ═══ Notification Cards ═══ */
    .notif-card {
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 14px; margin-bottom: 0.75rem;
      overflow: hidden; transition: all 180ms ease;
    }
    .notif-card-enabled {
      border-color: #c7d2fe;
      box-shadow: 0 2px 12px rgba(79,70,229,0.06);
    }
    .notif-card-header {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1rem 1.25rem; cursor: pointer;
      transition: background 150ms ease;
      &:hover { background: #fafbff; }
    }
    .notif-card-icon {
      width: 40px; height: 40px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .slack-icon { background: #fef3c7; color: #b45309; }
    .email-icon { background: #ede9fe; color: #7c3aed; }
    .notif-card-text { flex: 1; min-width: 0; }
    .notif-card-title { font-size: 0.9375rem; font-weight: 700; color: #111827; margin: 0; }
    .notif-card-desc { font-size: 0.75rem; color: #9ca3af; margin: 2px 0 0; }
    .notif-card-body {
      padding: 1rem 1.25rem 1.25rem;
      border-top: 1px solid #f1f5f9;
      animation: slideDown 200ms ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ── Toggle ── */
    .toggle-switch {
      position: relative; display: inline-block;
      width: 44px; height: 24px; flex-shrink: 0;
      cursor: pointer;
      input { opacity: 0; width: 0; height: 0; position: absolute; }
    }
    .toggle-slider {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: #d1d5db; border-radius: 24px;
      transition: background 200ms ease;
      &::before {
        content: ''; position: absolute; height: 18px; width: 18px;
        left: 3px; bottom: 3px; background: white;
        border-radius: 50%; transition: transform 200ms ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.15);
      }
    }
    .toggle-switch input:checked + .toggle-slider { background: #4f46e5; }
    .toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }

    /* ── Form Fields ── */
    .form-grid {
      display: grid; grid-template-columns: 2fr 1fr; gap: 0.5rem 0.75rem;
    }
    .form-group { display: flex; flex-direction: column; }
    .span-2 { grid-column: span 1; }
    @media (min-width: 500px) { .span-2 { grid-column: span 1; } }
    .field-label {
      display: block; font-size: 0.6875rem; font-weight: 700; color: #6b7280;
      margin: 0 0 0.3rem; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .field-input {
      width: 100%; padding: 0.5rem 0.75rem; border: 1.5px solid #e5e7eb;
      border-radius: 9px; font-size: 0.8125rem; font-family: inherit;
      color: #111827; background: #f8fafc; box-sizing: border-box;
      transition: all 150ms ease; margin-bottom: 0.5rem;
      &:focus { outline: none; border-color: #4f46e5; background: white; box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }
      &::placeholder { color: #c0c5ce; }
    }
    .field-hint { font-size: 0.6875rem; color: #b0b5bf; margin: -0.125rem 0 0.5rem; line-height: 1.4; }
    .input-with-action {
      display: flex; gap: 0.5rem; align-items: flex-start;
      .field-input { margin-bottom: 0; }
    }
    .checkbox-label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.8125rem; font-weight: 600; color: #374151;
      cursor: pointer; padding-top: 0.75rem;
      input { width: 16px; height: 16px; accent-color: #4f46e5; cursor: pointer; }
    }
    .divider {
      height: 1px; background: #f1f5f9; margin: 1rem 0;
    }

    /* ── Recipients ── */
    .toggle-row {
      display: flex; align-items: center; gap: 1rem; cursor: pointer;
    }
    .toggle-row-text { flex: 1; }
    .toggle-row-label { display: block; font-size: 0.875rem; font-weight: 700; color: #111827; }
    .toggle-row-hint { display: block; font-size: 0.75rem; color: #9ca3af; margin-top: 2px; }
    .recipient-option { margin-bottom: 0.25rem; }
    .dynamic-hint {
      display: flex; align-items: flex-start; gap: 0.5rem;
      margin-top: 0.75rem; padding: 0.75rem 1rem;
      background: #f0f4ff; border-radius: 10px;
      font-size: 0.75rem; color: #4f46e5; line-height: 1.5;
      code { background: rgba(79,70,229,0.1); padding: 1px 5px; border-radius: 4px; font-size: 0.6875rem; }
      svg { flex-shrink: 0; margin-top: 1px; }
    }

    /* ── Severity Cards ── */
    .severity-cards {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem;
      margin-bottom: 1.5rem;
    }
    @media (max-width: 600px) { .severity-cards { grid-template-columns: 1fr; } }
    .sev-card {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1rem 1.125rem; border-radius: 12px;
      border: 1.5px solid #e5e7eb; background: white;
      cursor: pointer; transition: all 180ms ease;
      input { position: absolute; opacity: 0; pointer-events: none; }
      &:hover { border-color: #d1d5db; background: #fafbff; }
      &.sev-active { border-color: #c7d2fe; background: #f5f3ff; box-shadow: 0 2px 8px rgba(79,70,229,0.08); }
    }
    .sev-indicator {
      width: 6px; height: 32px; border-radius: 3px; flex-shrink: 0;
      &.high { background: #dc2626; }
      &.medium { background: #d97706; }
      &.low { background: #059669; }
    }
    .sev-content { flex: 1; }
    .sev-label { display: block; font-size: 0.875rem; font-weight: 700; color: #111827; }
    .sev-desc { display: block; font-size: 0.6875rem; color: #9ca3af; }
    .sev-check {
      width: 24px; height: 24px; border-radius: 7px;
      border: 2px solid #e5e7eb; display: flex; align-items: center; justify-content: center;
      color: transparent; transition: all 150ms ease;
    }
    .sev-active .sev-check {
      background: #4f46e5; border-color: #4f46e5; color: white;
    }

    /* ── Save Bar ── */
    .save-bar {
      display: flex; align-items: center; justify-content: flex-end; gap: 1rem;
      padding: 1rem 1.25rem;
      background: white; border: 1.5px solid #e2e8f0; border-radius: 14px;
      position: sticky; bottom: 1rem;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.05);
    }
    .save-hint { font-size: 0.75rem; color: #9ca3af; }

    /* ═══ API Keys ═══ */
    .apikey-form-card {
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem;
    }
    .apikey-form-row {
      display: flex; gap: 0.75rem; align-items: flex-start;
    }
    .apikey-name-input { flex: 1; margin-bottom: 0; }
    .apikey-reveal {
      background: #f0fdf4; border: 1.5px solid #86efac;
      border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1rem;
      animation: slideDown 200ms ease;
    }
    .apikey-reveal-header {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.8125rem; font-weight: 700; color: #166534; margin-bottom: 0.75rem;
    }
    .apikey-reveal-body {
      display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;
    }
    .apikey-value {
      flex: 1; font-family: ui-monospace, monospace;
      font-size: 0.8125rem; color: #111827;
      background: white; border: 1.5px solid #bbf7d0;
      padding: 0.5rem 0.875rem; border-radius: 8px;
      word-break: break-all;
    }
    .apikey-list {
      display: flex; flex-direction: column; gap: 0.5rem;
    }
    .apikey-row {
      display: flex; align-items: center; gap: 1rem;
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 12px; padding: 0.875rem 1rem;
      transition: border-color 150ms ease;
      &:hover { border-color: #c7d2fe; }
    }
    .apikey-row-info {
      flex: 1; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; min-width: 0;
    }
    .apikey-row-name {
      font-size: 0.875rem; font-weight: 700; color: #111827;
    }
    .apikey-prefix {
      font-family: ui-monospace, monospace;
      font-size: 0.75rem; color: #4f46e5;
      background: #eef2ff; padding: 2px 8px; border-radius: 6px;
    }
    .apikey-meta {
      font-size: 0.75rem; color: #9ca3af;
    }
    .apikey-unused { color: #d1d5db; }

    /* ═══ Team ═══ */
    .invite-form-row {
      display: flex; gap: 0.75rem; align-items: flex-start; flex-wrap: wrap;
    }
    .invite-role-select { max-width: 130px; flex-shrink: 0; margin-bottom: 0; }
    .team-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .team-row {
      display: flex; align-items: center; gap: 0.875rem;
      background: white; border: 1.5px solid #e2e8f0;
      border-radius: 12px; padding: 0.75rem 1rem;
      transition: border-color 150ms ease;
      &:hover { border-color: #c7d2fe; }
      &.expired { opacity: 0.6; }
    }
    .team-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white; font-size: 0.75rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .pending-avatar {
      background: #f1f5f9; color: #9ca3af;
    }
    .team-info { flex: 1; min-width: 0; }
    .team-name { font-size: 0.875rem; font-weight: 700; color: #111827; }
    .team-email { font-size: 0.75rem; color: #9ca3af; margin-top: 1px; }
    .role-select {
      padding: 0.3rem 0.6rem; border: 1.5px solid #e5e7eb; border-radius: 7px;
      font-size: 0.75rem; font-weight: 600; color: #374151;
      background: #f8fafc; cursor: pointer; font-family: inherit;
    }
    .role-badge {
      padding: 3px 10px; border-radius: 99px;
      font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .role-admin   { background: #fef3c7; color: #d97706; }
    .role-developer { background: #eef2ff; color: #4f46e5; }
    .role-viewer  { background: #f1f5f9; color: #6b7280; }

    /* ═══ CI Snippet Cards ═══ */
    .snippet-card {
      background: #0f172a; border-radius: 12px;
      margin-bottom: 0.75rem; overflow: hidden;
    }
    .snippet-card-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.625rem 1rem;
      background: rgba(255,255,255,0.04);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .snippet-lang {
      font-size: 0.6875rem; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .snippet-card .btn-outline {
      background: transparent; color: #94a3b8; border-color: rgba(255,255,255,0.12);
      &:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: #e2e8f0; }
    }
    .snippet-code {
      margin: 0; padding: 1rem;
      font-family: ui-monospace, 'Cascadia Code', monospace;
      font-size: 0.75rem; line-height: 1.7;
      color: #e2e8f0;
      white-space: pre-wrap; word-break: break-all;
      overflow-x: auto;
    }

    /* ═══ Audit Log ═══ */
    .audit-table-wrap { overflow-x: auto; margin-bottom: 1rem; }
    .audit-table {
      width: 100%; border-collapse: collapse; font-size: 0.8125rem;
      th {
        text-align: left; padding: 0.625rem 1rem;
        font-size: 0.6875rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.06em; color: #9ca3af;
        border-bottom: 1.5px solid #f1f5f9; background: #fafafa;
      }
      td { padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; color: #374151; vertical-align: top; }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #fafbff; }
    }
    .audit-email { color: #4f46e5; font-size: 0.8125rem; }
    .audit-detail { color: #6b7280; font-size: 0.8125rem; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .audit-time { color: #9ca3af; font-size: 0.75rem; white-space: nowrap; }
    .audit-badge {
      display: inline-block; padding: 2px 8px; border-radius: 99px;
      font-size: 0.625rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;
      white-space: nowrap;
    }
    .audit-green  { background: #dcfce7; color: #166534; }
    .audit-blue   { background: #dbeafe; color: #1d4ed8; }
    .audit-purple { background: #ede9fe; color: #6d28d9; }
    .audit-orange { background: #ffedd5; color: #c2410c; }
    .audit-red    { background: #fee2e2; color: #b91c1c; }
    .audit-pagination {
      display: flex; align-items: center; gap: 0.75rem; justify-content: center;
      margin-top: 0.75rem;
    }
    .audit-page-info { font-size: 0.8125rem; color: #6b7280; }

    /* ═══ Billing Tab ═══ */
    .billing-plan-card {
      background: #1a1f2e; border: 1px solid #2d3748; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem;
    }
    .billing-plan-header {
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
    }
    .billing-plan-name { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
    .plan-badge {
      font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 99px; text-transform: uppercase; letter-spacing: 0.05em;
    }
    .plan-free     { background: #374151; color: #d1d5db; }
    .plan-pro      { background: #4f46e5; color: #fff; }
    .plan-business { background: #7c3aed; color: #fff; }
    .status-badge {
      font-size: 0.7rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 99px;
    }
    .status-warning { background: #fef3c7; color: #92400e; }
    .status-danger  { background: #fee2e2; color: #991b1b; }
    .billing-renewal { font-size: 0.8125rem; color: #6b7280; margin: 0; }
    .billing-plan-actions { display: flex; gap: 0.5rem; }
    .btn-ghost {
      padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.8125rem; font-weight: 500;
      background: transparent; border: none; color: #9ca3af; cursor: pointer; transition: color 0.15s;
      text-decoration: none;
    }
    .btn-ghost:hover { color: #e5e7eb; }

    .billing-usage-section { margin-top: 0.5rem; }
    .usage-title { font-size: 0.9375rem; font-weight: 600; color: #e5e7eb; margin: 0 0 1rem 0; }
    .usage-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; }
    .usage-card {
      background: #1a1f2e; border: 1px solid #2d3748; border-radius: 10px; padding: 1rem 1.25rem;
    }
    .usage-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .usage-label { font-size: 0.8125rem; color: #9ca3af; }
    .usage-value { font-size: 0.875rem; font-weight: 600; color: #e5e7eb; }
    .usage-bar-wrap { background: #2d3748; border-radius: 99px; height: 6px; overflow: hidden; }
    .usage-bar { height: 100%; background: #4f46e5; border-radius: 99px; transition: width 0.4s ease; min-width: 2px; }
    .usage-bar-warn   { background: #f59e0b; }
    .usage-bar-danger { background: #ef4444; }
    .feature-on  { color: #34d399; font-weight: 600; font-size: 0.8125rem; }
    .feature-off { color: #6b7280; font-size: 0.8125rem; }
    .upgrade-hint { font-size: 0.75rem; color: #818cf8; text-decoration: none; }
    .upgrade-hint:hover { color: #a5b4fc; }
    .feature-flag-grid { display: flex; flex-direction: column; gap: 0.6rem; }
    .feature-flag-row { display: flex; justify-content: space-between; align-items: center; }
  `]
})
export class ConfigurationComponent implements OnInit {
  activeTab: 'sources' | 'notifications' | 'api-keys' | 'team' | 'audit' | 'billing' = 'sources';
  sources: PipelineSource[] = [];
  loading = true;
  testingSourceId: number | null = null;

  // Notification settings
  notifSettings: NotificationSettings | null = null;
  notifLoading = true;
  savingNotif = false;
  testingSlack = false;
  testingEmail = false;
  testEmailRecipient = '';

  // API Keys
  apiKeys: ApiKey[] = [];
  apiKeysLoading = false;
  newKeyName = '';
  generatingKey = false;
  newlyCreatedKey: CreateApiKeyResponse | null = null;

  // Audit Log
  auditLogs: AuditEntry[] = [];
  auditLoading = false;
  auditPage = 1;
  auditPageSize = 50;
  auditTotal = 0;

  // Billing
  billingPlan: BillingPlan | null = null;
  billingLoading = false;

  // Team
  members: TeamMember[] = [];
  pendingInvites: PendingInvitation[] = [];
  teamLoading = false;
  inviteEmail = '';
  inviteRole = 'developer';
  sendingInvite = false;
  newInviteLink = '';

  constructor(
    private readonly configService: ConfigService,
    private readonly teamService: TeamService,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
    private readonly billingService: BillingService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.loadSources();
    this.loadNotificationSettings();
    // Support ?tab=billing query param (e.g. from Stripe redirect)
    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'billing') this.switchToBilling();
    });
  }

  loadSources(): void {
    this.loading = true;
    this.configService.getSources().subscribe({
      next: (sources) => { this.sources = sources; this.loading = false; },
      error: () => {
        this.snackBar.open('Failed to load sources', 'Dismiss', { duration: 4000 });
        this.loading = false;
      },
    });
  }

  // ── Source CRUD ──────────────────────────────────────────────

  openAddSource(): void {
    const ref = this.dialog.open(SourceFormDialogComponent, {
      width: '520px',
      data: {},
      panelClass: 'custom-dialog',
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.configService.createSource(result).subscribe({
        next: () => {
          this.snackBar.open('Source added successfully', 'OK', { duration: 3000 });
          this.loadSources();
        },
        error: () => this.snackBar.open('Failed to add source', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  openEditSource(source: PipelineSource): void {
    const ref = this.dialog.open(SourceFormDialogComponent, {
      width: '520px',
      data: { source },
      panelClass: 'custom-dialog',
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.configService.updateSource(source.id, result).subscribe({
        next: () => {
          this.snackBar.open('Source updated', 'OK', { duration: 3000 });
          this.loadSources();
        },
        error: () => this.snackBar.open('Failed to update source', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  deleteSource(source: PipelineSource): void {
    if (!confirm(`Delete "${source.name}" and all its repositories? This cannot be undone.`)) return;
    this.configService.deleteSource(source.id).subscribe({
      next: () => {
        this.snackBar.open('Source deleted', 'OK', { duration: 3000 });
        this.loadSources();
      },
      error: () => this.snackBar.open('Failed to delete source', 'Dismiss', { duration: 4000 }),
    });
  }

  testConnection(source: PipelineSource): void {
    this.testingSourceId = source.id;
    this.configService.testConnection(source.id).subscribe({
      next: (res) => {
        this.testingSourceId = null;
        this.snackBar.open(
          res.connected ? 'Connection successful!' : 'Connection failed — check token and URL',
          'OK', { duration: 4000 }
        );
      },
      error: () => {
        this.testingSourceId = null;
        this.snackBar.open('Connection test failed', 'Dismiss', { duration: 4000 });
      },
    });
  }

  // ── Repo Management ─────────────────────────────────────────

  openAddRepo(source: PipelineSource): void {
    const ref = this.dialog.open(AddRepoDialogComponent, {
      width: '480px',
      data: { sourceName: source.name, provider: source.provider },
      panelClass: 'custom-dialog',
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.configService.addRepo(source.id, result).subscribe({
        next: () => {
          this.snackBar.open('Repository added', 'OK', { duration: 3000 });
          this.loadSources();
        },
        error: () => this.snackBar.open('Failed to add repository', 'Dismiss', { duration: 4000 }),
      });
    });
  }

  toggleRepo(repo: ConnectedRepository): void {
    this.configService.updateRepo(repo.id, { isActive: !repo.isActive }).subscribe({
      next: () => this.loadSources(),
      error: () => this.snackBar.open('Failed to update repository', 'Dismiss', { duration: 4000 }),
    });
  }

  removeRepo(source: PipelineSource, repo: ConnectedRepository): void {
    if (!confirm(`Remove "${repo.fullName}" from ${source.name}?`)) return;
    this.configService.removeRepo(repo.id).subscribe({
      next: () => {
        this.snackBar.open('Repository removed', 'OK', { duration: 3000 });
        this.loadSources();
      },
      error: () => this.snackBar.open('Failed to remove repository', 'Dismiss', { duration: 4000 }),
    });
  }

  // ── Notification Settings ───────────────────────────────────

  loadNotificationSettings(): void {
    this.notifLoading = true;
    this.configService.getNotificationSettings().subscribe({
      next: (settings) => { this.notifSettings = settings; this.notifLoading = false; },
      error: () => {
        this.notifSettings = {
          id: 0, slackEnabled: false, emailEnabled: false, smtpPort: 587,
          smtpUseSsl: true, notifyPrAuthor: true, notifyOnHigh: true,
          notifyOnMedium: true, notifyOnLow: false, updatedAt: ''
        };
        this.notifLoading = false;
      },
    });
  }

  saveNotificationSettings(): void {
    if (!this.notifSettings) return;
    this.savingNotif = true;
    this.configService.updateNotificationSettings(this.notifSettings).subscribe({
      next: (updated) => {
        this.notifSettings = updated;
        this.savingNotif = false;
        this.snackBar.open('Notification settings saved', 'OK', { duration: 3000 });
      },
      error: () => {
        this.savingNotif = false;
        this.snackBar.open('Failed to save notification settings', 'Dismiss', { duration: 4000 });
      },
    });
  }

  testSlack(): void {
    this.testingSlack = true;
    this.configService.testSlack().subscribe({
      next: (res) => {
        this.testingSlack = false;
        this.snackBar.open(res.success ? 'Slack test sent successfully!' : 'Slack test failed — check webhook URL', 'OK', { duration: 4000 });
      },
      error: () => {
        this.testingSlack = false;
        this.snackBar.open('Slack test failed', 'Dismiss', { duration: 4000 });
      },
    });
  }

  testEmail(): void {
    if (!this.testEmailRecipient) {
      this.snackBar.open('Enter a test recipient email', 'OK', { duration: 3000 });
      return;
    }
    this.testingEmail = true;
    this.configService.testEmail(this.testEmailRecipient).subscribe({
      next: (res) => {
        this.testingEmail = false;
        this.snackBar.open(res.success ? 'Test email sent!' : 'Email test failed — check SMTP settings', 'OK', { duration: 4000 });
      },
      error: () => {
        this.testingEmail = false;
        this.snackBar.open('Email test failed', 'Dismiss', { duration: 4000 });
      },
    });
  }

  // ── API Keys ─────────────────────────────────────────────────

  // ── Team ──────────────────────────────────────────────────────

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'admin';
  }

  currentUserId(): string {
    return this.authService.currentUser()?.id?.toString() ?? '';
  }

  switchToTeam(): void {
    this.activeTab = 'team';
    if (this.members.length === 0 && !this.teamLoading) {
      this.loadTeam();
    }
  }

  loadTeam(): void {
    this.teamLoading = true;
    this.teamService.getMembers().subscribe({
      next: (m) => { this.members = m; this.teamLoading = false; },
      error: () => { this.teamLoading = false; },
    });
    this.teamService.getInvitations().subscribe({
      next: (i) => { this.pendingInvites = i; },
      error: () => {},
    });
  }

  sendInvite(): void {
    if (!this.inviteEmail.trim()) return;
    this.sendingInvite = true;
    this.teamService.createInvitation({ email: this.inviteEmail.trim(), role: this.inviteRole }).subscribe({
      next: (res) => {
        this.sendingInvite = false;
        this.inviteEmail = '';
        const base = window.location.origin;
        this.newInviteLink = `${base}/register?invite=${res.inviteToken}`;
        this.loadTeam();
      },
      error: (err) => {
        this.sendingInvite = false;
        this.snackBar.open(err?.error?.message ?? 'Failed to send invite', 'Dismiss', { duration: 4000 });
      },
    });
  }

  changeRole(member: TeamMember, role: string): void {
    this.teamService.updateRole(member.userId, role).subscribe({
      next: () => { member.role = role; this.snackBar.open('Role updated', 'OK', { duration: 2500 }); },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to update role', 'Dismiss', { duration: 4000 }),
    });
  }

  removeMember(member: TeamMember): void {
    if (!confirm(`Remove ${member.user.firstName} ${member.user.lastName} from your team?`)) return;
    this.teamService.removeMember(member.userId).subscribe({
      next: () => {
        this.members = this.members.filter(m => m.id !== member.id);
        this.snackBar.open('Member removed', 'OK', { duration: 2500 });
      },
      error: (err) => this.snackBar.open(err?.error?.message ?? 'Failed to remove member', 'Dismiss', { duration: 4000 }),
    });
  }

  revokeInvite(inv: PendingInvitation): void {
    if (!confirm(`Revoke invitation for ${inv.email}?`)) return;
    this.teamService.revokeInvitation(inv.id).subscribe({
      next: () => {
        this.pendingInvites = this.pendingInvites.filter(i => i.id !== inv.id);
        this.snackBar.open('Invitation revoked', 'OK', { duration: 2500 });
      },
      error: () => this.snackBar.open('Failed to revoke invitation', 'Dismiss', { duration: 4000 }),
    });
  }

  private readonly ingestUrl = 'https://localhost:7096/api/ingest';

  get githubSnippet(): string {
    return `- name: Report failure to FixMyBuild
  if: failure()
  run: |
    curl -s -X POST ${this.ingestUrl} \\
      -H "Authorization: Bearer \${{ secrets.FMB_API_KEY }}" \\
      -H "Content-Type: application/json" \\
      -d '{
        "pipelineName": "\${{ github.workflow }}",
        "repoOwner": "\${{ github.repository_owner }}",
        "repoName": "\${{ github.event.repository.name }}",
        "branch": "\${{ github.ref_name }}",
        "runId": \${{ github.run_id }},
        "provider": "github",
        "actorLogin": "\${{ github.actor }}",
        "errorLog": "See run \${{ github.run_id }}"
      }'`;
  }

  get gitlabSnippet(): string {
    return `report_failure:
  stage: .post
  when: on_failure
  script:
    - |
      curl -s -X POST ${this.ingestUrl} \\
        -H "Authorization: Bearer $FMB_API_KEY" \\
        -H "Content-Type: application/json" \\
        -d "{
          \\"pipelineName\\": \\"$CI_JOB_NAME\\",
          \\"repoOwner\\": \\"$CI_PROJECT_NAMESPACE\\",
          \\"repoName\\": \\"$CI_PROJECT_NAME\\",
          \\"branch\\": \\"$CI_COMMIT_REF_NAME\\",
          \\"runId\\": $CI_PIPELINE_ID,
          \\"provider\\": \\"gitlab\\",
          \\"actorLogin\\": \\"$GITLAB_USER_LOGIN\\"
        }"`;
  }

  get azureSnippet(): string {
    return `- task: Bash@3
  condition: failed()
  displayName: Report failure to FixMyBuild
  inputs:
    targetType: inline
    script: |
      curl -s -X POST ${this.ingestUrl} \\
        -H "Authorization: Bearer $(FMB_API_KEY)" \\
        -H "Content-Type: application/json" \\
        -d '{
          "pipelineName": "$(Build.DefinitionName)",
          "repoOwner": "$(Build.Repository.Name)",
          "repoName": "$(Build.Repository.Name)",
          "branch": "$(Build.SourceBranchName)",
          "runId": $(Build.BuildId),
          "provider": "azure_devops",
          "actorLogin": "$(Build.RequestedFor)"
        }'`;
  }

  copySnippet(provider: 'github' | 'gitlab' | 'azure'): void {
    const text = provider === 'github' ? this.githubSnippet
      : provider === 'gitlab' ? this.gitlabSnippet
      : this.azureSnippet;
    navigator.clipboard.writeText(text).then(() => {
      this.snackBar.open('Snippet copied to clipboard', 'OK', { duration: 2500 });
    });
  }

  switchToApiKeys(): void {
    this.activeTab = 'api-keys';
    if (this.apiKeys.length === 0 && !this.apiKeysLoading) {
      this.loadApiKeys();
    }
  }

  loadApiKeys(): void {
    this.apiKeysLoading = true;
    this.configService.getApiKeys().subscribe({
      next: (keys) => { this.apiKeys = keys; this.apiKeysLoading = false; },
      error: () => {
        this.snackBar.open('Failed to load API keys', 'Dismiss', { duration: 4000 });
        this.apiKeysLoading = false;
      },
    });
  }

  generateApiKey(): void {
    if (!this.newKeyName.trim()) return;
    this.generatingKey = true;
    this.configService.createApiKey({ name: this.newKeyName.trim() }).subscribe({
      next: (response) => {
        this.newlyCreatedKey = response;
        this.newKeyName = '';
        this.generatingKey = false;
        this.loadApiKeys();
      },
      error: () => {
        this.generatingKey = false;
        this.snackBar.open('Failed to generate API key', 'Dismiss', { duration: 4000 });
      },
    });
  }

  revokeApiKey(key: ApiKey): void {
    if (!confirm(`Revoke "${key.name}"? Any CI jobs using this key will stop working immediately.`)) return;
    this.configService.revokeApiKey(key.id).subscribe({
      next: () => {
        this.snackBar.open('API key revoked', 'OK', { duration: 3000 });
        this.apiKeys = this.apiKeys.filter(k => k.id !== key.id);
      },
      error: () => this.snackBar.open('Failed to revoke API key', 'Dismiss', { duration: 4000 }),
    });
  }

  copyKey(raw: string): void {
    navigator.clipboard.writeText(raw).then(() => {
      this.snackBar.open('Key copied to clipboard', 'OK', { duration: 2500 });
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Helpers ─────────────────────────────────────────────────

  getProviderLabel(provider: string): string {
    switch (provider) {
      case 'github': return 'GitHub Actions';
      case 'azure_devops': return 'Azure DevOps';
      case 'gitlab': return 'GitLab CI';
      default: return provider;
    }
  }

  // ── Audit Log ────────────────────────────────────────────────

  switchToAudit(): void {
    this.activeTab = 'audit';
    if (this.auditLogs.length === 0 && !this.auditLoading) {
      this.loadAuditLog();
    }
  }

  loadAuditLog(): void {
    this.auditLoading = true;
    this.auditService.getAuditLog(this.auditPage, this.auditPageSize).subscribe({
      next: (res) => {
        this.auditLogs = res.items;
        this.auditTotal = res.total;
        this.auditLoading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load audit log', 'Dismiss', { duration: 4000 });
        this.auditLoading = false;
      },
    });
  }

  auditTotalPages(): number {
    return Math.max(1, Math.ceil(this.auditTotal / this.auditPageSize));
  }

  auditPageChange(delta: number): void {
    this.auditPage += delta;
    this.auditLogs = [];
    this.loadAuditLog();
  }

  getAuditLabel(action: string): string {
    return AUDIT_ACTION_LABELS[action] ?? action;
  }

  getAuditColor(action: string): string {
    return AUDIT_ACTION_COLORS[action] ?? 'blue';
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  // ── Billing ────────────────────────────────────────────────────

  switchToBilling(): void {
    this.activeTab = 'billing';
    if (!this.billingPlan && !this.billingLoading) this.loadBillingPlan();
  }

  loadBillingPlan(): void {
    this.billingLoading = true;
    this.billingService.getCurrentPlan().subscribe({
      next: (plan) => { this.billingPlan = plan; this.billingLoading = false; },
      error: () => {
        this.snackBar.open('Failed to load billing info', 'Dismiss', { duration: 4000 });
        this.billingLoading = false;
      }
    });
  }

  openBillingPortal(): void {
    this.billingService.openBillingPortal();
  }

  usagePct(used: number, limit: number): number {
    if (limit <= 0) return 0;
    return Math.min(100, Math.round((used / limit) * 100));
  }

  formatBillingDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getProviderIcon(provider: string): string {
    switch (provider) {
      case 'github':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="#4f46e5"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>';
      case 'azure_devops':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="#2563eb"><path d="M0 8.877L2.247 5.91l8.405-3.416V.022l7.37 5.393L2.966 8.338v8.225L0 15.707zm24-4.45v14.651l-5.753 4.9-9.303-3.057v3.056l-5.978-7.416 15.057 1.798V2.669z"/></svg>';
      case 'gitlab':
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="#d97706"><path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.42.42 0 0 1 4.82 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.49h8.1l2.44-7.51A.42.42 0 0 1 18.6 2a.43.43 0 0 1 .58 0 .42.42 0 0 1 .11.18l2.44 7.51L23 13.45a.84.84 0 0 1-.35.94z"/></svg>';
      default:
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="#6b7280"><circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="2"/></svg>';
    }
  }
}
