import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { TranslationService } from '../../../core/i18n/translation.service';
import { ApiResponse, PagedResult } from '../../../core/models/api-response.model';
import {
  InvoiceClientListItemDto,
  InvoiceListFilters,
  InvoiceListItemDto,
  InvoiceListItemView,
  InvoicePageResult,
} from '../models/invoice.models';
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
  formatInvoiceDateTime,
  invoiceStatusClass,
} from '../utils/invoice-formatters';
import { InvoiceApiService } from '../services/invoice-api.service';

const defaultFilters: InvoiceListFilters = {
  status: null,
  clientId: null,
  from: null,
  to: null,
  minAmount: null,
  maxAmount: null,
  sortBy: 'created',
  sortDirection: 'desc',
  page: 1,
  limit: 20,
  searchTerm: '',
};

@Injectable({ providedIn: 'root' })
export class InvoiceListStore {
  private readonly invoiceApi = inject(InvoiceApiService);
  private readonly translation = inject(TranslationService);
  private readonly resultSignal = signal<InvoicePageResult | null>(null);
  private readonly filtersSignal = signal<InvoiceListFilters>(defaultFilters);
  private readonly clientsSignal = signal<readonly InvoiceClientListItemDto[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly isLoadingClientsSignal = signal(false);
  private readonly errorMessagesSignal = signal<readonly string[]>([]);
  private readonly clientErrorMessagesSignal = signal<readonly string[]>([]);

  readonly result = this.resultSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly clients = this.clientsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isLoadingClients = this.isLoadingClientsSignal.asReadonly();
  readonly errorMessages = this.errorMessagesSignal.asReadonly();
  readonly clientErrorMessages = this.clientErrorMessagesSignal.asReadonly();

  readonly pageInfo = computed(() => {
    const result = this.result();

    return {
      page: result?.page ?? this.filters().page,
      pageSize: result?.pageSize ?? this.filters().limit,
      totalCount: result?.totalCount ?? 0,
      totalPages: result?.totalPages ?? 0,
    };
  });

  readonly rows = computed<readonly InvoiceListItemView[]>(() => {
    const result = this.result();

    if (!result) {
      return [];
    }

    return result.items.map((invoice) => this.toRow(invoice));
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.filters();

    return Boolean(
      filters.status ||
      filters.clientId ||
      filters.from ||
      filters.to ||
      filters.searchTerm.trim() ||
      filters.minAmount !== null ||
      filters.maxAmount !== null,
    );
  });

  loadInvoices(overrides: Partial<InvoiceListFilters> = {}): void {
    if (this.isLoading()) {
      return;
    }

    const nextFilters = this.normalizeFilters({ ...this.filters(), ...overrides });
    this.filtersSignal.set(nextFilters);
    this.isLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.invoiceApi
      .listInvoices(nextFilters)
      .pipe(
        map((response) => this.unwrap(response, 'Invoices request failed.')),
        finalize(() => this.isLoadingSignal.set(false)),
      )
      .subscribe({
        next: (result) => this.resultSignal.set(result),
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  loadClients(query = ''): void {
    if (this.isLoadingClients()) {
      return;
    }

    this.isLoadingClientsSignal.set(true);
    this.clientErrorMessagesSignal.set([]);

    this.invoiceApi
      .listClients(query)
      .pipe(
        map((response) => this.unwrap(response, 'Clients request failed.')),
        finalize(() => this.isLoadingClientsSignal.set(false)),
      )
      .subscribe({
        next: (result) => this.clientsSignal.set(result.items),
        error: (error) => this.clientErrorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  toggleSort(sortBy: InvoiceListFilters['sortBy']): void {
    const filters = this.filters();
    const nextDirection =
      filters.sortBy === sortBy && filters.sortDirection === 'asc' ? 'desc' : 'asc';

    this.loadInvoices({
      page: 1,
      sortBy,
      sortDirection: filters.sortBy === sortBy ? nextDirection : 'asc',
    });
  }

  resetFilters(): void {
    this.loadInvoices({ ...defaultFilters, limit: this.filters().limit });
  }

  private normalizeFilters(filters: InvoiceListFilters): InvoiceListFilters {
    return {
      ...filters,
      status: filters.status || null,
      clientId: filters.clientId || null,
      from: filters.from || null,
      to: filters.to || null,
      minAmount: this.normalizeAmount(filters.minAmount),
      maxAmount: this.normalizeAmount(filters.maxAmount),
      sortBy: filters.sortBy || 'created',
      sortDirection: filters.sortDirection || 'desc',
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

  private toRow(invoice: InvoiceListItemDto): InvoiceListItemView {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      status: invoice.status,
      statusLabel: this.translation.translate(`invoiceStatus.${invoice.status}`),
      statusClass: invoiceStatusClass(invoice.status),
      totalDisplay: formatInvoiceCurrency(
        invoice.total,
        invoice.currency,
        this.translation.language(),
      ),
      dueDateDisplay: formatInvoiceDate(
        invoice.dueDate,
        this.translation.language(),
        this.translation.translate('common.notSet'),
      ),
      sentAtDisplay: formatInvoiceDate(
        invoice.sentAt,
        this.translation.language(),
        this.translation.translate('common.notSet'),
      ),
      sentAtFullDisplay: formatInvoiceDateTime(
        invoice.sentAt,
        this.translation.language(),
        this.translation.translate('common.notSet'),
      ),
    };
  }

  private normalizeAmount(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
}
