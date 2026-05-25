import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse, PagedResult } from '../../../core/models/api-response.model';
import {
  InvoiceCancellationDto,
  InvoiceClientListItemDto,
  InvoiceDetailDto,
  InvoiceDuplicateRequest,
  InvoiceListItemDto,
  InvoiceListQuery,
  InvoicePaymentDto,
  InvoicePaymentRequest,
  InvoiceReminderRequest,
  InvoiceReminderSettingsDto,
  InvoiceSaveRequest,
  InvoiceSendRequest,
  InvoiceSendResultDto,
} from '../models/invoice.models';

@Injectable({ providedIn: 'root' })
export class InvoiceApiService {
  private readonly http = inject(HttpClient);

  listInvoices(query: InvoiceListQuery): Observable<ApiResponse<PagedResult<InvoiceListItemDto>>> {
    return this.http.get<ApiResponse<PagedResult<InvoiceListItemDto>>>(apiUrl('/api/invoices'), {
      params: this.toInvoiceListParams(query),
    });
  }

  getInvoice(
    id: string,
    options: { useWorkspaceCurrency?: boolean } = {},
  ): Observable<ApiResponse<InvoiceDetailDto>> {
    const params = options.useWorkspaceCurrency
      ? new HttpParams().set('useWorkspaceCurrency', true)
      : undefined;

    return this.http.get<ApiResponse<InvoiceDetailDto>>(apiUrl(`/api/invoices/${id}`), {
      params,
    });
  }

  createInvoice(request: InvoiceSaveRequest): Observable<ApiResponse<InvoiceDetailDto>> {
    return this.http.post<ApiResponse<InvoiceDetailDto>>(apiUrl('/api/invoices'), request);
  }

  updateInvoice(
    id: string,
    request: InvoiceSaveRequest,
  ): Observable<ApiResponse<InvoiceDetailDto>> {
    return this.http.put<ApiResponse<InvoiceDetailDto>>(apiUrl(`/api/invoices/${id}`), request);
  }

  sendInvoice(
    id: string,
    request: InvoiceSendRequest = {},
  ): Observable<ApiResponse<InvoiceSendResultDto>> {
    return this.http.post<ApiResponse<InvoiceSendResultDto>>(
      apiUrl(`/api/invoices/${id}/send`),
      request,
    );
  }

  resendInvoice(
    id: string,
    request: InvoiceSendRequest = {},
  ): Observable<ApiResponse<InvoiceSendResultDto>> {
    return this.http.post<ApiResponse<InvoiceSendResultDto>>(
      apiUrl(`/api/invoices/${id}/resend`),
      request,
    );
  }

  markPaid(
    id: string,
    request: InvoicePaymentRequest = {},
  ): Observable<ApiResponse<InvoicePaymentDto>> {
    return this.http.post<ApiResponse<InvoicePaymentDto>>(
      apiUrl(`/api/invoices/${id}/mark-paid`),
      request,
    );
  }

  updateReminders(
    id: string,
    request: InvoiceReminderRequest,
  ): Observable<ApiResponse<InvoiceReminderSettingsDto>> {
    return this.http.patch<ApiResponse<InvoiceReminderSettingsDto>>(
      apiUrl(`/api/invoices/${id}/reminders`),
      request,
    );
  }

  duplicateInvoice(
    id: string,
    request: InvoiceDuplicateRequest = {},
  ): Observable<ApiResponse<InvoiceDetailDto>> {
    return this.http.post<ApiResponse<InvoiceDetailDto>>(
      apiUrl(`/api/invoices/${id}/duplicate`),
      request,
    );
  }

  cancelInvoice(id: string): Observable<ApiResponse<InvoiceCancellationDto>> {
    return this.http.post<ApiResponse<InvoiceCancellationDto>>(
      apiUrl(`/api/invoices/${id}/cancel`),
      {},
    );
  }

  deleteInvoice(id: string): Observable<ApiResponse<InvoiceCancellationDto>> {
    return this.http.delete<ApiResponse<InvoiceCancellationDto>>(apiUrl(`/api/invoices/${id}`));
  }

  downloadPdf(id: string, preview = false): Observable<Blob> {
    return this.http.get(apiUrl(`/api/invoices/${id}/pdf`), {
      params: new HttpParams().set('preview', preview),
      responseType: 'blob',
    });
  }

  listClients(query = ''): Observable<ApiResponse<PagedResult<InvoiceClientListItemDto>>> {
    let params = new HttpParams().set('page', 1).set('limit', 100);

    if (query.trim().length > 0) {
      params = params.set('q', query.trim());
    }

    return this.http.get<ApiResponse<PagedResult<InvoiceClientListItemDto>>>(
      apiUrl('/api/clients'),
      {
        params,
      },
    );
  }

  private toInvoiceListParams(query: InvoiceListQuery): HttpParams {
    let params = new HttpParams().set('page', query.page).set('limit', query.limit);

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.clientId) {
      params = params.set('clientId', query.clientId);
    }

    if (query.from) {
      params = params.set('from', query.from);
    }

    if (query.to) {
      params = params.set('to', query.to);
    }

    if (query.searchTerm?.trim()) {
      params = params.set('q', query.searchTerm.trim());
    }

    if (query.minAmount !== null && query.minAmount !== undefined) {
      params = params.set('minAmount', query.minAmount);
    }

    if (query.maxAmount !== null && query.maxAmount !== undefined) {
      params = params.set('maxAmount', query.maxAmount);
    }

    if (query.sortBy) {
      params = params.set('sortBy', query.sortBy);
    }

    if (query.sortDirection) {
      params = params.set('sortDirection', query.sortDirection);
    }

    return params;
  }
}
