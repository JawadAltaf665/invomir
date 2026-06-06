import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import {
  LucideBell,
  LucideCheck,
  LucideExternalLink,
  LucideInbox,
  LucideRefreshCcw,
  LucideRotateCcw,
  LucideSearch,
  LucideTrash2,
} from '@lucide/angular';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import {
  NotificationPriority,
  NotificationStatus,
  NotificationType,
  notificationPriorityOptions,
  notificationStatusOptions,
  notificationTypeOptions,
} from '../../models/notification.models';
import { NotificationStore } from '../../store/notification.store';
import {
  notificationPriorityClass,
  notificationTypeClass,
} from '../../utils/notification-formatters';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PaginationComponent,
    LucideBell,
    LucideCheck,
    LucideExternalLink,
    LucideInbox,
    LucideRefreshCcw,
    LucideRotateCcw,
    LucideSearch,
    LucideTrash2,
    TranslatePipe,
  ],
  templateUrl: './notification-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationListComponent implements OnInit {
  protected readonly store = inject(NotificationStore);
  protected readonly typeOptions = notificationTypeOptions;
  protected readonly statusOptions = notificationStatusOptions;
  protected readonly priorityOptions = notificationPriorityOptions;
  protected readonly notificationPriorityClass = notificationPriorityClass;
  protected readonly notificationTypeClass = notificationTypeClass;

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  protected readonly filterForm = this.formBuilder.group({
    searchTerm: [''],
    type: ['all' as NotificationType],
    status: ['all' as NotificationStatus],
    priority: ['all' as NotificationPriority],
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.store.loadHistory();
    this.store.loadLatest();
  }

  protected refresh(): void {
    this.store.loadHistory({ page: this.store.filters().page });
    this.store.loadLatest();
  }

  protected applyFilters(): void {
    this.store.loadHistory({
      ...this.filterForm.getRawValue(),
      page: 1,
    });
  }

  protected resetFilters(): void {
    this.filterForm.setValue({
      searchTerm: '',
      type: 'all',
      status: 'all',
      priority: 'all',
    });
    this.store.resetFilters();
  }

  protected changePage(page: number): void {
    this.store.loadHistory({ page });
  }

  protected changePageSize(limit: number): void {
    this.store.loadHistory({ page: 1, limit });
  }

  protected markRead(notificationId: string): void {
    this.store.markRead(notificationId);
  }

  protected deleteNotification(notificationId: string): void {
    this.store.deleteNotification(notificationId);
  }

  protected openNotification(actionUrl: string | null, notificationId: string): void {
    this.store.markRead(notificationId);

    if (actionUrl) {
      void this.router.navigateByUrl(actionUrl);
    }
  }
}
