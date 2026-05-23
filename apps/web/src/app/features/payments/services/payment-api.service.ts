import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PaymentHistoryDto, PaymentListQuery, StripeConnectUrlDto } from '../models/payment.models';

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);

  listPayments(query: PaymentListQuery): Observable<ApiResponse<PaymentHistoryDto>> {
    return this.http.get<ApiResponse<PaymentHistoryDto>>(apiUrl('/api/payments'), {
      params: this.toPaymentListParams(query),
    });
  }

  createStripeConnect(): Observable<ApiResponse<StripeConnectUrlDto>> {
    return this.http.post<ApiResponse<StripeConnectUrlDto>>(apiUrl('/api/stripe/connect'), {});
  }

  private toPaymentListParams(query: PaymentListQuery): HttpParams {
    return new HttpParams()
      .set('status', query.status)
      .set('page', Math.max(1, query.page || 1))
      .set('limit', Math.min(100, Math.max(1, query.limit || 20)));
  }
}
