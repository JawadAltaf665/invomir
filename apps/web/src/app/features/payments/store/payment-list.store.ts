import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  PaymentHistoryItemDto,
  PaymentListFilters,
  PaymentListItemView,
  PaymentPageResult,
} from '../models/payment.models';
import { PaymentApiService } from '../services/payment-api.service';
import {
  formatPaymentCurrency,
  formatPaymentDateTime,
  formatPaymentGatewayReference,
  paymentMethodLabel,
  paymentStatusClass,
  paymentStatusLabel,
} from '../utils/payment-formatters';

const defaultFilters: PaymentListFilters = {
  status: 'all',
  page: 1,
  limit: 20,
  searchTerm: '',
};

@Injectable({ providedIn: 'root' })
export class PaymentListStore {
  private readonly paymentApi = inject(PaymentApiService);
  private readonly resultSignal = signal<PaymentPageResult | null>(null);
  private readonly filtersSignal = signal<PaymentListFilters>(defaultFilters);
  private readonly isLoadingSignal = signal(false);
  private readonly errorMessagesSignal = signal<readonly string[]>([]);

  readonly result = this.resultSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly errorMessages = this.errorMessagesSignal.asReadonly();

  readonly pageInfo = computed(() => {
    const result = this.result();

    return {
      page: result?.page ?? this.filters().page,
      pageSize: result?.pageSize ?? this.filters().limit,
      totalCount: result?.totalCount ?? 0,
      totalPages: result?.totalPages ?? 0,
    };
  });

  readonly rows = computed<readonly PaymentListItemView[]>(() => {
    const result = this.result();

    if (!result) {
      return [];
    }

    const searchTerm = this.filters().searchTerm.trim().toLowerCase();
    const rows = result.items.map((payment) => this.toRow(payment));

    if (!searchTerm) {
      return rows;
    }

    return rows.filter((payment) =>
      [
        payment.invoiceNumber,
        payment.clientName,
        payment.amountDisplay,
        payment.methodLabel,
        payment.statusLabel,
        payment.gatewayReferenceDisplay,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm),
    );
  });

  loadPayments(overrides: Partial<PaymentListFilters> = {}): void {
    if (this.isLoading()) {
      return;
    }

    const nextFilters = this.normalizeFilters({ ...this.filters(), ...overrides });
    this.filtersSignal.set(nextFilters);
    this.isLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.paymentApi
      .listPayments(nextFilters)
      .pipe(
        map((response) => this.unwrap(response, 'Payments request failed.')),
        finalize(() => this.isLoadingSignal.set(false)),
      )
      .subscribe({
        next: (result) => this.resultSignal.set(result),
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  setSearchTerm(searchTerm: string): void {
    this.filtersSignal.update((filters) => ({ ...filters, searchTerm }));
  }

  resetFilters(): void {
    this.loadPayments(defaultFilters);
  }

  private normalizeFilters(filters: PaymentListFilters): PaymentListFilters {
    return {
      ...filters,
      status: filters.status || 'all',
      page: Math.max(1, filters.page || 1),
      limit: Math.min(100, Math.max(1, filters.limit || 20)),
      searchTerm: filters.searchTerm ?? '',
    };
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }

  private toRow(payment: PaymentHistoryItemDto): PaymentListItemView {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      invoiceNumber: payment.invoiceNumber,
      clientId: payment.clientId,
      clientName: payment.clientName,
      amountDisplay: formatPaymentCurrency(payment.amount, payment.currency),
      methodLabel: paymentMethodLabel(payment.method),
      status: payment.status,
      statusLabel: paymentStatusLabel(payment.status),
      statusClass: paymentStatusClass(payment.status),
      paidAtDisplay: formatPaymentDateTime(payment.paidAt),
      gatewayReferenceDisplay: formatPaymentGatewayReference(
        payment.stripePaymentIntentId,
        payment.stripeChargeId,
      ),
      noteDisplay: payment.note?.trim() || 'No note',
    };
  }
}
