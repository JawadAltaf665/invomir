import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  CurrentSubscriptionDto,
  SubscriptionCancellationDto,
  SubscriptionCheckoutDto,
  SubscriptionCheckoutRequest,
  SubscriptionPlansDto,
} from '../models/subscription.models';

@Injectable({ providedIn: 'root' })
export class SubscriptionApiService {
  private readonly http = inject(HttpClient);

  getCurrentSubscription(): Observable<ApiResponse<CurrentSubscriptionDto>> {
    return this.http.get<ApiResponse<CurrentSubscriptionDto>>(apiUrl('/api/subscriptions'));
  }

  getPlans(): Observable<ApiResponse<SubscriptionPlansDto>> {
    return this.http.get<ApiResponse<SubscriptionPlansDto>>(apiUrl('/api/subscriptions/plans'));
  }

  createCheckout(
    request: SubscriptionCheckoutRequest,
  ): Observable<ApiResponse<SubscriptionCheckoutDto>> {
    return this.http.post<ApiResponse<SubscriptionCheckoutDto>>(
      apiUrl('/api/subscriptions/checkout'),
      request,
    );
  }

  cancelSubscription(): Observable<ApiResponse<SubscriptionCancellationDto>> {
    return this.http.post<ApiResponse<SubscriptionCancellationDto>>(
      apiUrl('/api/subscriptions/cancel'),
      {},
    );
  }
}
