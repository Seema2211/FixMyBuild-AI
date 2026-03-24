import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { AuditLogResponse } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getAuditLog(page = 1, pageSize = 50, action?: string): Observable<AuditLogResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    if (action) params = params.set('action', action);
    return this.http.get<AuditLogResponse>(`${this.apiUrl}/api/audit`, { params });
  }
}
