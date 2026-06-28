import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription, finalize, forkJoin, map, timer } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { ApiResponse, PagedResult } from '../../../core/models/api-response.model';
import { TranslationService } from '../../../core/i18n/translation.service';
import {
  NotificationDto,
  NotificationListItemView,
  NotificationListQuery,
} from '../models/notification.models';
import { NotificationApiService } from '../services/notification-api.service';
import { toNotificationView } from '../utils/notification-formatters';

const pollingIntervalMs = 60_000;

const defaultFilters: NotificationListQuery = {
  type: 'all',
  status: 'all',
  priority: 'all',
  searchTerm: '',
  page: 1,
  limit: 20,
};

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly notificationApi = inject(NotificationApiService);
  private readonly translation = inject(TranslationService);

  private readonly latestSignal = signal<readonly NotificationDto[]>([]);
  private readonly unreadCountSignal = signal(0);
  private readonly historyResultSignal = signal<PagedResult<NotificationDto> | null>(null);
  private readonly filtersSignal = signal<NotificationListQuery>(defaultFilters);
  private readonly isLatestLoadingSignal = signal(false);
  private readonly isHistoryLoadingSignal = signal(false);
  private readonly isMutatingSignal = signal(false);
  private readonly errorMessagesSignal = signal<readonly string[]>([]);
  private pollingSubscription: Subscription | null = null;

  readonly latest = this.latestSignal.asReadonly();
  readonly unreadCount = this.unreadCountSignal.asReadonly();
  readonly historyResult = this.historyResultSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly isLatestLoading = this.isLatestLoadingSignal.asReadonly();
  readonly isHistoryLoading = this.isHistoryLoadingSignal.asReadonly();
  readonly isMutating = this.isMutatingSignal.asReadonly();
  readonly errorMessages = this.errorMessagesSignal.asReadonly();

  readonly latestRows = computed<readonly NotificationListItemView[]>(() =>
    this.latest().map((notification) => this.toView(notification)),
  );

  readonly historyRows = computed<readonly NotificationListItemView[]>(() =>
    this.historyResult()?.items.map((notification) => this.toView(notification)) ?? [],
  );

  readonly pageInfo = computed(() => {
    const result = this.historyResult();

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
      filters.type !== 'all' ||
        filters.status !== 'all' ||
        filters.priority !== 'all' ||
        filters.searchTerm.trim(),
    );
  });

  startPolling(): void {
    if (this.pollingSubscription) {
      return;
    }

    this.loadLatest();
    this.pollingSubscription = timer(pollingIntervalMs, pollingIntervalMs).subscribe(() =>
      this.loadLatest(),
    );
  }

  stopPolling(): void {
    this.pollingSubscription?.unsubscribe();
    this.pollingSubscription = null;
  }

  loadLatest(): void {
    if (this.isLatestLoading()) {
      return;
    }

    this.isLatestLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    forkJoin({
      latest: this.notificationApi
        .listUnread(10)
        .pipe(map((response) => this.unwrap(response, 'Notifications could not be loaded.'))),
      count: this.notificationApi
        .getUnreadCount()
        .pipe(map((response) => this.unwrap(response, 'Notification count could not be loaded.'))),
    })
      .pipe(finalize(() => this.isLatestLoadingSignal.set(false)))
      .subscribe({
        next: ({ latest, count }) => {
          this.latestSignal.set(latest);
          this.unreadCountSignal.set(count.count);
        },
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  loadHistory(overrides: Partial<NotificationListQuery> = {}): void {
    if (this.isHistoryLoading()) {
      return;
    }

    const nextFilters = this.normalizeFilters({ ...this.filters(), ...overrides });
    this.filtersSignal.set(nextFilters);
    this.isHistoryLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.notificationApi
      .listNotifications(nextFilters)
      .pipe(
        map((response) => this.unwrap(response, 'Notifications could not be loaded.')),
        finalize(() => this.isHistoryLoadingSignal.set(false)),
      )
      .subscribe({
        next: (result) => this.historyResultSignal.set(result),
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  setSearchTerm(searchTerm: string): void {
    this.filtersSignal.update((filters) => ({ ...filters, searchTerm }));
  }

  resetFilters(): void {
    this.loadHistory(defaultFilters);
  }

  markRead(notificationId: string): void {
    if (this.isMutating()) {
      return;
    }

    this.isMutatingSignal.set(true);
    this.notificationApi
      .markRead(notificationId)
      .pipe(
        map((response) => this.unwrap(response, 'Notification could not be marked read.')),
        finalize(() => this.isMutatingSignal.set(false)),
      )
      .subscribe({
        next: (notification) => {
          this.replaceNotification(notification);
          this.refreshUnreadState();
        },
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  markAllRead(): void {
    if (this.isMutating()) {
      return;
    }

    this.isMutatingSignal.set(true);
    this.notificationApi
      .markAllRead()
      .pipe(
        map((response) => this.unwrap(response, 'Notifications could not be marked read.')),
        finalize(() => this.isMutatingSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.latestSignal.set([]);
          this.unreadCountSignal.set(0);
          this.loadHistory();
        },
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  deleteNotification(notificationId: string): void {
    if (this.isMutating()) {
      return;
    }

    this.isMutatingSignal.set(true);
    this.notificationApi
      .deleteNotification(notificationId)
      .pipe(
        map((response) => this.unwrap(response, 'Notification could not be deleted.')),
        finalize(() => this.isMutatingSignal.set(false)),
      )
      .subscribe({
        next: () => {
          this.latestSignal.update((items) =>
            items.filter((notification) => notification.id !== notificationId),
          );
          this.loadLatest();
          this.loadHistory();
        },
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  private replaceNotification(notification: NotificationDto): void {
    this.latestSignal.update((items) =>
      notification.isRead
        ? items.filter((currentNotification) => currentNotification.id !== notification.id)
        : items.map((currentNotification) =>
            currentNotification.id === notification.id ? notification : currentNotification,
          ),
    );

    this.historyResultSignal.update((result) => {
      if (!result) {
        return result;
      }

      return {
        ...result,
        items: result.items.map((currentNotification) =>
          currentNotification.id === notification.id ? notification : currentNotification,
        ),
      };
    });
  }

  private refreshUnreadState(): void {
    this.unreadCountSignal.update((count) => Math.max(0, count - 1));
    this.loadLatest();
  }

  private normalizeFilters(filters: NotificationListQuery): NotificationListQuery {
    return {
      type: filters.type || 'all',
      status: filters.status || 'all',
      priority: filters.priority || 'all',
      searchTerm: filters.searchTerm ?? '',
      page: Math.max(1, filters.page || 1),
      limit: Math.min(100, Math.max(1, filters.limit || 20)),
    };
  }

  private toView(notification: NotificationDto): NotificationListItemView {
    return toNotificationView(
      notification,
      (key, parameters) => this.translation.translate(key, parameters),
      this.translation.language(),
    );
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
