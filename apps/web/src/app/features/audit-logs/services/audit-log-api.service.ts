import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse, PagedResult } from '../../../core/models/api-response.model';
import { AuditLogDto, AuditLogListQuery } from '../models/audit-log.models';

@Injectable({ providedIn: 'root' })
export class AuditLogApiService {
  private readonly http = inject(HttpClient);

  listAuditLogs(query: AuditLogListQuery): Observable<ApiResponse<PagedResult<AuditLogDto>>> {
    return this.http.get<ApiResponse<PagedResult<AuditLogDto>>>(apiUrl('/api/audit-logs'), {
      params: this.toAuditLogListParams(query),
    });
  }

  listEntityAuditLogs(
    entityName: string,
    entityId: string,
    query: Pick<AuditLogListQuery, 'from' | 'to' | 'page' | 'limit'>,
  ): Observable<ApiResponse<PagedResult<AuditLogDto>>> {
    return this.http.get<ApiResponse<PagedResult<AuditLogDto>>>(
      apiUrl(`/api/audit-logs/${encodeURIComponent(entityName)}/${encodeURIComponent(entityId)}`),
      {
        params: this.toEntityAuditLogParams(query),
      },
    );
  }

  private toAuditLogListParams(query: AuditLogListQuery): HttpParams {
    let params = this.toEntityAuditLogParams(query);

    if (query.entityName && query.entityName !== 'all') {
      params = params.set('entityName', query.entityName);
    }

    if (query.entityId.trim()) {
      params = params.set('entityId', query.entityId.trim());
    }

    if (query.action && query.action !== 'all') {
      params = params.set('action', query.action);
    }

    return params;
  }

  private toEntityAuditLogParams(
    query: Pick<AuditLogListQuery, 'from' | 'to' | 'page' | 'limit'>,
  ): HttpParams {
    let params = new HttpParams()
      .set('page', Math.max(1, query.page || 1))
      .set('limit', Math.min(100, Math.max(1, query.limit || 20)));

    if (query.from) {
      params = params.set('from', new Date(`${query.from}T00:00:00`).toISOString());
    }

    if (query.to) {
      params = params.set('to', new Date(`${query.to}T23:59:59`).toISOString());
    }

    return params;
  }
}
