import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { CallingCountry } from '../../shared/models/calling-country.model';
import { apiUrl } from '../config/api-url';
import { ApiResponseError } from '../errors/api-response-error';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class LookupApiService {
  private readonly http = inject(HttpClient);
  private callingCountries$?: Observable<readonly CallingCountry[]>;

  listCallingCountries(): Observable<readonly CallingCountry[]> {
    this.callingCountries$ ??= this.http
      .get<ApiResponse<readonly CallingCountry[]>>(apiUrl('/api/lookups/calling-countries'))
      .pipe(
        map((response) => this.unwrap(response, 'Calling countries could not be loaded.')),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.callingCountries$;
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
