import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
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
  invoiceStatusLabel,
} from '../utils/invoice-formatters';
import { InvoiceApiService } from '../services/invoice-api.service';

const defaultFilters: InvoiceListFilters = {
  status: null,
  clientId: null,
  from: null,
  to: null,
  page: 1,
  limit: 20,
  searchTerm: '',
};

@Injectable({ providedIn: 'root' })
export class InvoiceListStore {
  private readonly invoiceApi = inject(InvoiceApiService);
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

    const searchTerm = this.filters().searchTerm.trim().toLowerCase();
    const rows = result.items.map((invoice) => this.toRow(invoice));

    if (!searchTerm) {
      return rows;
    }

    return rows.filter((invoice) =>
      [invoice.invoiceNumber, invoice.clientName, invoice.statusLabel]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm),
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

  setSearchTerm(searchTerm: string): void {
    this.filtersSignal.update((filters) => ({ ...filters, searchTerm }));
  }

  resetFilters(): void {
    this.loadInvoices(defaultFilters);
  }

  private normalizeFilters(filters: InvoiceListFilters): InvoiceListFilters {
    return {
      ...filters,
      status: filters.status || null,
      clientId: filters.clientId || null,
      from: filters.from || null,
      to: filters.to || null,
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
      statusLabel: invoiceStatusLabel(invoice.status),
      statusClass: invoiceStatusClass(invoice.status),
      totalDisplay: formatInvoiceCurrency(invoice.total, invoice.currency),
      dueDateDisplay: formatInvoiceDate(invoice.dueDate),
      sentAtDisplay: formatInvoiceDateTime(invoice.sentAt),
    };
  }
}
