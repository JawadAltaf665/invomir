import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AdminUserDetailDto,
  AdminUserListQuery,
  AdminUserPageResult,
  AdminUserPlanUpdateDto,
  AdminUserTrialUpdateDto,
  UpdateAdminUserPlanRequest,
  UpdateAdminUserTrialRequest,
} from '../models/admin-user.models';

@Injectable({ providedIn: 'root' })
export class AdminUserApiService {
  private readonly http = inject(HttpClient);

  listUsers(query: AdminUserListQuery): Observable<ApiResponse<AdminUserPageResult>> {
    return this.http.get<ApiResponse<AdminUserPageResult>>(apiUrl('/api/admin/users'), {
      params: this.toListParams(query),
    });
  }

  getUser(id: string): Observable<ApiResponse<AdminUserDetailDto>> {
    return this.http.get<ApiResponse<AdminUserDetailDto>>(
      apiUrl(`/api/admin/users/${encodeURIComponent(id)}`),
    );
  }

  updatePlan(
    id: string,
    request: UpdateAdminUserPlanRequest,
  ): Observable<ApiResponse<AdminUserPlanUpdateDto>> {
    return this.http.patch<ApiResponse<AdminUserPlanUpdateDto>>(
      apiUrl(`/api/admin/users/${encodeURIComponent(id)}/plan`),
      request,
    );
  }

  updateTrial(
    id: string,
    request: UpdateAdminUserTrialRequest,
  ): Observable<ApiResponse<AdminUserTrialUpdateDto>> {
    return this.http.patch<ApiResponse<AdminUserTrialUpdateDto>>(
      apiUrl(`/api/admin/users/${encodeURIComponent(id)}/trial`),
      request,
    );
  }

  private toListParams(query: AdminUserListQuery): HttpParams {
    let params = new HttpParams()
      .set('page', Math.max(1, query.page || 1))
      .set('limit', Math.min(100, Math.max(1, query.limit || 20)));

    const search = query.q.trim();

    if (search) {
      params = params.set('q', search);
    }

    return params;
  }
}
