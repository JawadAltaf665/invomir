import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { TranslationService } from '../../../core/i18n/translation.service';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  ClientListFilters,
  ClientListItemDto,
  ClientListItemView,
  ClientPageResult,
} from '../models/client.models';
import { ClientApiService } from '../services/client-api.service';
import { clientInitials, formatClientCurrency, formatClientDate } from '../utils/client-formatters';

const defaultFilters: ClientListFilters = {
  q: null,
  page: 1,
  limit: 20,
  searchTerm: '',
};

@Injectable({ providedIn: 'root' })
export class ClientListStore {
  private readonly clientApi = inject(ClientApiService);
  private readonly translation = inject(TranslationService);
  private readonly resultSignal = signal<ClientPageResult | null>(null);
  private readonly filtersSignal = signal<ClientListFilters>(defaultFilters);
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

  readonly rows = computed<readonly ClientListItemView[]>(() => {
    const result = this.result();

    if (!result) {
      return [];
    }

    return result.items.map((client) => this.toRow(client));
  });

  loadClients(overrides: Partial<ClientListFilters> = {}): void {
    if (this.isLoading()) {
      return;
    }

    const nextFilters = this.normalizeFilters({ ...this.filters(), ...overrides });
    this.filtersSignal.set(nextFilters);
    this.isLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.clientApi
      .listClients(nextFilters)
      .pipe(
        map((response) => this.unwrap(response, 'Clients request failed.')),
        finalize(() => this.isLoadingSignal.set(false)),
      )
      .subscribe({
        next: (result) => this.resultSignal.set(result),
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  resetFilters(): void {
    this.loadClients(defaultFilters);
  }

  private normalizeFilters(filters: ClientListFilters): ClientListFilters {
    const searchTerm = (filters.searchTerm ?? filters.q ?? '').trim();

    return {
      ...filters,
      q: searchTerm || null,
      page: Math.max(1, filters.page || 1),
      limit: Math.min(100, Math.max(1, filters.limit || 20)),
      searchTerm,
    };
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }

  private toRow(client: ClientListItemDto): ClientListItemView {
    return {
      id: client.id,
      name: client.name,
      email: client.email,
      avatarInitials: clientInitials(client.name),
      companyDisplay: client.company || this.translation.translate('common.notSet'),
      totalRevenueDisplay: formatClientCurrency(
        client.totalRevenue,
        client.currency,
        this.translation.language(),
      ),
      invoiceCountDisplay: this.translation.translate(
        client.invoiceCount === 1 ? 'clients.invoiceCount' : 'clients.invoiceCountPlural',
        {
          count: new Intl.NumberFormat(this.translation.language()).format(client.invoiceCount),
        },
      ),
      invoiceStatusSummaryDisplay: this.invoiceStatusSummary(client),
      lastInvoiceDisplay: formatClientDate(
        client.lastInvoiceAt,
        this.translation.language(),
        this.translation.translate('common.notSet'),
      ),
    };
  }

  private invoiceStatusSummary(client: ClientListItemDto): string {
    const statuses = [
      ['draft', client.draftInvoiceCount],
      ['sent', client.sentInvoiceCount],
      ['viewed', client.viewedInvoiceCount],
      ['paid', client.paidInvoiceCount],
      ['overdue', client.overdueInvoiceCount],
      ['cancelled', client.cancelledInvoiceCount],
    ] as const;

    return statuses
      .filter(([, count]) => count > 0)
      .map(([status, count]) => `${count} ${this.translation.translate(`invoiceStatus.${status}`)}`)
      .join(', ');
  }
}
