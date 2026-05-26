import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../config/api-url';
import { ApiResponse } from '../models/api-response.model';
import {
  AuthTokenDto,
  ForgotPasswordRequest,
  LoginRequest,
  LogoutRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(request: LoginRequest): Observable<ApiResponse<AuthTokenDto>> {
    return this.http.post<ApiResponse<AuthTokenDto>>(apiUrl('/api/auth/login'), request, {
      withCredentials: true
    });
  }

  register(request: RegisterRequest): Observable<ApiResponse<AuthTokenDto>> {
    return this.http.post<ApiResponse<AuthTokenDto>>(apiUrl('/api/auth/register'), request, {
      withCredentials: true
    });
  }

  refresh(): Observable<ApiResponse<AuthTokenDto>> {
    return this.http.post<ApiResponse<AuthTokenDto>>(apiUrl('/api/auth/refresh'), {}, {
      withCredentials: true
    });
  }

  logout(request: LogoutRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(apiUrl('/api/auth/logout'), request, {
      withCredentials: true
    });
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(apiUrl('/api/auth/forgot-password'), request, {
      withCredentials: true
    });
  }

  resetPassword(request: ResetPasswordRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(apiUrl('/api/auth/reset-password'), request, {
      withCredentials: true
    });
  }

  verifyEmail(request: VerifyEmailRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(apiUrl('/api/auth/verify-email'), request, {
      withCredentials: true
    });
  }
}
