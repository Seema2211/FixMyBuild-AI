import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type {
  PipelineListItem,
  PipelinePage,
  PipelineDetails,
  PipelineStats,
  PipelineAnalytics,
  CreatedPullRequest,
  CreatePrRequest,
  AnalyzeRequest,
} from '../models/pipeline.model';

@Injectable({ providedIn: 'root' })
export class PipelineService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getPipelines(params?: {
    search?: string;
    severity?: string;
    page?: number;
    pageSize?: number;
  }): Observable<PipelinePage> {
    let httpParams = new HttpParams();
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.severity) httpParams = httpParams.set('severity', params.severity);
    if (params?.page) httpParams = httpParams.set('page', params.page.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    return this.http.get<PipelinePage>(`${this.apiUrl}/api/pipelines`, { params: httpParams });
  }

  getStats(): Observable<PipelineStats> {
    return this.http.get<PipelineStats>(`${this.apiUrl}/api/pipelines/stats`);
  }

  getAnalytics(): Observable<PipelineAnalytics> {
    return this.http.get<PipelineAnalytics>(`${this.apiUrl}/api/pipelines/analytics`);
  }

  getPipelineDetails(id: string): Observable<PipelineDetails> {
    return this.http.get<PipelineDetails>(`${this.apiUrl}/api/pipelines/${encodeURIComponent(id)}`);
  }

  analyze(request: AnalyzeRequest): Observable<PipelineDetails> {
    return this.http.post<PipelineDetails>(`${this.apiUrl}/api/pipelines/analyze`, request);
  }

  createPR(request: CreatePrRequest): Observable<CreatedPullRequest> {
    return this.http.post<CreatedPullRequest>(`${this.apiUrl}/api/pipelines/create-pr`, request);
  }

  seedDemo(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/api/demo/seed`, {});
  }
}
