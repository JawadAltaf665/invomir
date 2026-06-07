import { HttpClient, HttpEvent } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  ChangePasswordRequest,
  UpdateUserProfileRequest,
  UserLogoDto,
  UserProfilePictureDto,
  UserProfileDto,
} from '../models/settings.models';

@Injectable({ providedIn: 'root' })
export class SettingsApiService {
  private readonly http = inject(HttpClient);

  getCurrentUser(): Observable<ApiResponse<UserProfileDto>> {
    return this.http.get<ApiResponse<UserProfileDto>>(apiUrl('/api/users/me'));
  }

  updateCurrentUser(request: UpdateUserProfileRequest): Observable<ApiResponse<UserProfileDto>> {
    return this.http.put<ApiResponse<UserProfileDto>>(apiUrl('/api/users/me'), request);
  }

  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(apiUrl('/api/users/me/password'), request, {
      withCredentials: true,
    });
  }

  uploadLogo(file: File): Observable<HttpEvent<ApiResponse<UserLogoDto>>> {
    const body = new FormData();
    body.append('logo', file);

    return this.http.post<ApiResponse<UserLogoDto>>(apiUrl('/api/users/me/logo'), body, {
      observe: 'events',
      reportProgress: true,
    });
  }

  uploadProfilePicture(file: File): Observable<HttpEvent<ApiResponse<UserProfilePictureDto>>> {
    const body = new FormData();
    body.append('profilePicture', file);

    return this.http.post<ApiResponse<UserProfilePictureDto>>(
      apiUrl('/api/users/me/profile-picture'),
      body,
      {
        observe: 'events',
        reportProgress: true,
      },
    );
  }
}
