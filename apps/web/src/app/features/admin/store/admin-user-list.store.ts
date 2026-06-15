import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AdminUserListFilters,
  AdminUserListItemView,
  AdminUserPageResult,
} from '../models/admin-user.models';
import { AdminUserApiService } from '../services/admin-user-api.service';
import { toAdminUserListItemView } from '../utils/admin-user-formatters';

const defaultFilters: AdminUserListFilters = {
  q: '',
  role: '',
  plan: '',
  isActive: '',
  emailVerified: '',
  isTrialActive: '',
  hasStripeCustomer: '',
  page: 1,
  limit: 20,
};

@Injectable({ providedIn: 'root' })
export class AdminUserListStore {
  private readonly adminUserApi = inject(AdminUserApiService);

  private readonly resultSignal = signal<AdminUserPageResult | null>(null);
  private readonly filtersSignal = signal<AdminUserListFilters>(defaultFilters);
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

  readonly rows = computed<readonly AdminUserListItemView[]>(() => {
    const result = this.result();

    return result?.items.map((user) => toAdminUserListItemView(user)) ?? [];
  });

  loadUsers(overrides: Partial<AdminUserListFilters> = {}): void {
    if (this.isLoading()) {
      return;
    }

    const nextFilters = this.normalizeFilters({ ...this.filters(), ...overrides });
    this.filtersSignal.set(nextFilters);
    this.isLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.adminUserApi
      .listUsers(nextFilters)
      .pipe(
        map((response) => this.unwrap(response, 'Admin users request failed.')),
        finalize(() => this.isLoadingSignal.set(false)),
      )
      .subscribe({
        next: (result) => this.resultSignal.set(result),
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  resetFilters(): void {
    this.loadUsers(defaultFilters);
  }

  private normalizeFilters(filters: AdminUserListFilters): AdminUserListFilters {
    return {
      q: filters.q.trim(),
      role: filters.role || '',
      plan: filters.plan || '',
      isActive: filters.isActive === '' ? '' : Boolean(filters.isActive),
      emailVerified: filters.emailVerified === '' ? '' : Boolean(filters.emailVerified),
      isTrialActive: filters.isTrialActive === '' ? '' : Boolean(filters.isTrialActive),
      hasStripeCustomer:
        filters.hasStripeCustomer === '' ? '' : Boolean(filters.hasStripeCustomer),
      page: Math.max(1, filters.page || 1),
      limit: Math.min(100, Math.max(1, filters.limit || 20)),
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
