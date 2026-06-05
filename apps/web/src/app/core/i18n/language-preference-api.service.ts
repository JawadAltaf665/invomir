import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../config/api-url';
import { ApiResponse } from '../models/api-response.model';
import {
  LanguagePreferenceDto,
  UpdateLanguagePreferenceRequest,
} from './language-preference.models';

@Injectable({ providedIn: 'root' })
export class LanguagePreferenceApiService {
  private readonly http = inject(HttpClient);

  getLanguage(): Observable<ApiResponse<LanguagePreferenceDto>> {
    return this.http.get<ApiResponse<LanguagePreferenceDto>>(apiUrl('/api/settings/language'));
  }

  updateLanguage(
    request: UpdateLanguagePreferenceRequest,
  ): Observable<ApiResponse<LanguagePreferenceDto>> {
    return this.http.put<ApiResponse<LanguagePreferenceDto>>(
      apiUrl('/api/settings/language'),
      request,
    );
  }
}
