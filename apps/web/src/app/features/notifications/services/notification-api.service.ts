import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse, PagedResult } from '../../../core/models/api-response.model';
import {
  NotificationDto,
  NotificationListQuery,
  UnreadNotificationCountDto,
} from '../models/notification.models';

@Injectable({ providedIn: 'root' })
export class NotificationApiService {
  private readonly http = inject(HttpClient);

  listNotifications(
    query: NotificationListQuery,
  ): Observable<ApiResponse<PagedResult<NotificationDto>>> {
    return this.http.get<ApiResponse<PagedResult<NotificationDto>>>(
      apiUrl('/api/notifications'),
      {
        params: this.toListParams(query),
      },
    );
  }

  listUnread(limit = 10): Observable<ApiResponse<readonly NotificationDto[]>> {
    return this.http.get<ApiResponse<readonly NotificationDto[]>>(
      apiUrl('/api/notifications/unread'),
      {
        params: new HttpParams().set('limit', Math.min(50, Math.max(1, limit))),
      },
    );
  }

  getUnreadCount(): Observable<ApiResponse<UnreadNotificationCountDto>> {
    return this.http.get<ApiResponse<UnreadNotificationCountDto>>(
      apiUrl('/api/notifications/unread-count'),
    );
  }

  getNotification(id: string): Observable<ApiResponse<NotificationDto>> {
    return this.http.get<ApiResponse<NotificationDto>>(
      apiUrl(`/api/notifications/${encodeURIComponent(id)}`),
    );
  }

  markRead(id: string): Observable<ApiResponse<NotificationDto>> {
    return this.http.put<ApiResponse<NotificationDto>>(
      apiUrl(`/api/notifications/${encodeURIComponent(id)}/read`),
      {},
    );
  }

  markAllRead(): Observable<ApiResponse<number>> {
    return this.http.put<ApiResponse<number>>(apiUrl('/api/notifications/read-all'), {});
  }

  deleteNotification(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(
      apiUrl(`/api/notifications/${encodeURIComponent(id)}`),
    );
  }

  private toListParams(query: NotificationListQuery): HttpParams {
    let params = new HttpParams()
      .set('page', Math.max(1, query.page || 1))
      .set('limit', Math.min(100, Math.max(1, query.limit || 20)));

    if (query.type && query.type !== 'all') {
      params = params.set('type', query.type);
    }

    if (query.status && query.status !== 'all') {
      params = params.set('status', query.status);
    }

    if (query.priority && query.priority !== 'all') {
      params = params.set('priority', query.priority);
    }

    if (query.searchTerm.trim()) {
      params = params.set('q', query.searchTerm.trim());
    }

    return params;
  }
}
