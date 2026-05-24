import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../config/api-url';
import { ApiResponse } from '../models/api-response.model';
import {
  CurrentUserProfileDto,
  UpdateCurrentUserProfileRequest,
} from '../models/current-user-profile.model';

@Injectable({ providedIn: 'root' })
export class CurrentUserApiService {
  private readonly http = inject(HttpClient);

  getCurrentUser(): Observable<ApiResponse<CurrentUserProfileDto>> {
    return this.http.get<ApiResponse<CurrentUserProfileDto>>(apiUrl('/api/users/me'));
  }

  updateCurrentUser(
    request: UpdateCurrentUserProfileRequest,
  ): Observable<ApiResponse<CurrentUserProfileDto>> {
    return this.http.put<ApiResponse<CurrentUserProfileDto>>(apiUrl('/api/users/me'), request);
  }
}
