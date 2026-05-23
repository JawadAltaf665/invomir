import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse, PagedResult } from '../../../core/models/api-response.model';
import {
  ClientDetailDto,
  ClientDto,
  ClientListItemDto,
  ClientListQuery,
  ClientSaveRequest,
} from '../models/client.models';

@Injectable({ providedIn: 'root' })
export class ClientApiService {
  private readonly http = inject(HttpClient);

  listClients(query: ClientListQuery): Observable<ApiResponse<PagedResult<ClientListItemDto>>> {
    return this.http.get<ApiResponse<PagedResult<ClientListItemDto>>>(apiUrl('/api/clients'), {
      params: this.toListParams(query),
    });
  }

  getClient(id: string, page = 1, limit = 20): Observable<ApiResponse<ClientDetailDto>> {
    return this.http.get<ApiResponse<ClientDetailDto>>(apiUrl(`/api/clients/${id}`), {
      params: new HttpParams()
        .set('page', Math.max(1, page))
        .set('limit', Math.min(100, Math.max(1, limit))),
    });
  }

  createClient(request: ClientSaveRequest): Observable<ApiResponse<ClientDto>> {
    return this.http.post<ApiResponse<ClientDto>>(apiUrl('/api/clients'), request);
  }

  updateClient(id: string, request: ClientSaveRequest): Observable<ApiResponse<ClientDto>> {
    return this.http.put<ApiResponse<ClientDto>>(apiUrl(`/api/clients/${id}`), request);
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/clients/${id}`));
  }

  private toListParams(query: ClientListQuery): HttpParams {
    let params = new HttpParams()
      .set('page', Math.max(1, query.page || 1))
      .set('limit', Math.min(100, Math.max(1, query.limit || 20)));

    if (query.q?.trim()) {
      params = params.set('q', query.q.trim());
    }

    return params;
  }
}
