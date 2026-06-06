import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse } from '../../../core/models/api-response.model';
import { DashboardActionItemsDto, DashboardDto } from '../models/dashboard.models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<ApiResponse<DashboardDto>> {
    return this.http.get<ApiResponse<DashboardDto>>(apiUrl('/api/dashboard'));
  }

  getActionItems(): Observable<ApiResponse<DashboardActionItemsDto>> {
    return this.http.get<ApiResponse<DashboardActionItemsDto>>(
      apiUrl('/api/dashboard/action-items'),
    );
  }
}
