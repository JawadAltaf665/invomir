import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { ApiResponse, PagedResult } from '../../../core/models/api-response.model';
import { AuditLogDto, AuditLogListFilters, AuditLogListItemView } from '../models/audit-log.models';
import { AuditLogApiService } from '../services/audit-log-api.service';
import { toAuditLogView } from '../utils/audit-log-formatters';

const defaultFilters: AuditLogListFilters = {
  entityName: 'all',
  entityId: '',
  action: 'all',
  from: '',
  to: '',
  page: 1,
  limit: 20,
  searchTerm: '',
};

@Injectable({ providedIn: 'root' })
export class AuditLogListStore {
  private readonly auditLogApi = inject(AuditLogApiService);

  private readonly resultSignal = signal<PagedResult<AuditLogDto> | null>(null);
  private readonly filtersSignal = signal<AuditLogListFilters>(defaultFilters);
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

  readonly hasActiveFilters = computed(() => {
    const filters = this.filters();

    return Boolean(
      filters.entityName !== 'all' ||
        filters.action !== 'all' ||
        filters.entityId.trim() ||
        filters.from ||
        filters.to ||
        filters.searchTerm.trim(),
    );
  });

  readonly rows = computed<readonly AuditLogListItemView[]>(() => {
    const result = this.result();

    if (!result) {
      return [];
    }

    return result.items.map((auditLog) => toAuditLogView(auditLog));
  });

  loadAuditLogs(overrides: Partial<AuditLogListFilters> = {}): void {
    if (this.isLoading()) {
      return;
    }

    const nextFilters = this.normalizeFilters({ ...this.filters(), ...overrides });
    this.filtersSignal.set(nextFilters);
    this.isLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.auditLogApi
      .listAuditLogs(nextFilters)
      .pipe(
        map((response) => this.unwrap(response, 'Audit logs request failed.')),
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
    this.loadAuditLogs(defaultFilters);
  }

  private normalizeFilters(filters: AuditLogListFilters): AuditLogListFilters {
    return {
      entityName: filters.entityName || 'all',
      entityId: filters.entityId?.trim() ?? '',
      action: filters.action || 'all',
      from: filters.from ?? '',
      to: filters.to ?? '',
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
}
