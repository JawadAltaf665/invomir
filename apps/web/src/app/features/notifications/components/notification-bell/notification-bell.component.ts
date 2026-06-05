import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import {
  LucideBell,
  LucideCheck,
  LucideCheckCheck,
  LucideExternalLink,
  LucideInbox,
} from '@lucide/angular';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { NotificationStore } from '../../store/notification.store';
import {
  notificationPriorityClass,
  notificationTypeClass,
} from '../../utils/notification-formatters';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    LucideBell,
    LucideCheck,
    LucideCheckCheck,
    LucideExternalLink,
    LucideInbox,
    TranslatePipe,
  ],
  templateUrl: './notification-bell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  protected readonly store = inject(NotificationStore);
  private readonly router = inject(Router);

  protected readonly notificationPriorityClass = notificationPriorityClass;
  protected readonly notificationTypeClass = notificationTypeClass;

  ngOnInit(): void {
    this.store.startPolling();
  }

  ngOnDestroy(): void {
    this.store.stopPolling();
  }

  protected openNotification(actionUrl: string | null, notificationId: string): void {
    this.store.markRead(notificationId);

    if (actionUrl) {
      void this.router.navigateByUrl(actionUrl);
    }
  }

  protected markRead(event: MouseEvent, notificationId: string): void {
    event.stopPropagation();
    this.store.markRead(notificationId);
  }

  protected markAllRead(event: MouseEvent): void {
    event.stopPropagation();
    this.store.markAllRead();
  }
}
