import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  PipelineSource,
  ConnectedRepository,
  CreateSourceRequest,
  UpdateSourceRequest,
  AddRepoRequest,
  UpdateRepoRequest,
  TestConnectionResult,
  NotificationSettings,
  TestResult,
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
} from '../models/config.model';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  // ── Pipeline Sources ──────────────────────────────────────────

  getSources(): Observable<PipelineSource[]> {
    return this.http.get<PipelineSource[]>(`${this.apiUrl}/api/config/sources`);
  }

  getSource(id: number): Observable<PipelineSource> {
    return this.http.get<PipelineSource>(`${this.apiUrl}/api/config/sources/${id}`);
  }

  createSource(request: CreateSourceRequest): Observable<PipelineSource> {
    return this.http.post<PipelineSource>(`${this.apiUrl}/api/config/sources`, request);
  }

  updateSource(id: number, request: UpdateSourceRequest): Observable<PipelineSource> {
    return this.http.put<PipelineSource>(`${this.apiUrl}/api/config/sources/${id}`, request);
  }

  deleteSource(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/config/sources/${id}`);
  }

  testConnection(id: number): Observable<TestConnectionResult> {
    return this.http.post<TestConnectionResult>(`${this.apiUrl}/api/config/sources/${id}/test`, {});
  }

  // ── Connected Repositories ────────────────────────────────────

  getRepos(sourceId: number): Observable<ConnectedRepository[]> {
    return this.http.get<ConnectedRepository[]>(`${this.apiUrl}/api/config/sources/${sourceId}/repos`);
  }

  addRepo(sourceId: number, request: AddRepoRequest): Observable<ConnectedRepository> {
    return this.http.post<ConnectedRepository>(`${this.apiUrl}/api/config/sources/${sourceId}/repos`, request);
  }

  updateRepo(repoId: number, request: UpdateRepoRequest): Observable<ConnectedRepository> {
    return this.http.put<ConnectedRepository>(`${this.apiUrl}/api/config/repos/${repoId}`, request);
  }

  removeRepo(repoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/config/repos/${repoId}`);
  }

  // ── Notification Settings ────────────────────────────────────

  getNotificationSettings(): Observable<NotificationSettings> {
    return this.http.get<NotificationSettings>(`${this.apiUrl}/api/config/notifications`);
  }

  updateNotificationSettings(settings: Partial<NotificationSettings>): Observable<NotificationSettings> {
    return this.http.put<NotificationSettings>(`${this.apiUrl}/api/config/notifications`, settings);
  }

  testSlack(): Observable<TestResult> {
    return this.http.post<TestResult>(`${this.apiUrl}/api/config/notifications/test-slack`, {});
  }

  testEmail(recipient: string): Observable<TestResult> {
    return this.http.post<TestResult>(`${this.apiUrl}/api/config/notifications/test-email`, { recipient });
  }

  // ── API Keys ──────────────────────────────────────────────────

  getApiKeys(): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(`${this.apiUrl}/api/config/api-keys`);
  }

  createApiKey(request: CreateApiKeyRequest): Observable<CreateApiKeyResponse> {
    return this.http.post<CreateApiKeyResponse>(`${this.apiUrl}/api/config/api-keys`, request);
  }

  revokeApiKey(keyId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/config/api-keys/${keyId}`);
  }
}
