import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { FailureFeedback, FailurePattern, PatternPage, SubmitFeedbackRequest } from '../models/feedback.model';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getFeedback(failureId: string): Observable<FailureFeedback> {
    return this.http.get<FailureFeedback>(
      `${this.apiUrl}/api/failures/${encodeURIComponent(failureId)}/feedback`
    );
  }

  submitFeedback(failureId: string, req: SubmitFeedbackRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/api/failures/${encodeURIComponent(failureId)}/feedback`,
      req
    );
  }

  getPatterns(page = 1, pageSize = 20): Observable<PatternPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PatternPage>(`${this.apiUrl}/api/patterns`, { params });
  }

  getPattern(fingerprint: string): Observable<FailurePattern> {
    return this.http.get<FailurePattern>(
      `${this.apiUrl}/api/patterns/${encodeURIComponent(fingerprint)}`
    );
  }
}
