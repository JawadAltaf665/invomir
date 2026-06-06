import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import {
  LucideAlertTriangle,
  LucideArrowRight,
  LucideCheckCircle2,
  LucideInfo,
  LucideShieldAlert,
} from '@lucide/angular';

import { DashboardActionItemDto } from '../../models/dashboard.models';

@Component({
  selector: 'app-dashboard-action-center',
  standalone: true,
  imports: [
    MatButtonModule,
    LucideAlertTriangle,
    LucideArrowRight,
    LucideCheckCircle2,
    LucideInfo,
    LucideShieldAlert,
  ],
  templateUrl: './dashboard-action-center.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardActionCenterComponent {
  readonly items = input.required<readonly DashboardActionItemDto[]>();

  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected openAction(item: DashboardActionItemDto): void {
    if (!item.actionUrl) {
      return;
    }

    if (/^https?:\/\//i.test(item.actionUrl)) {
      if (isPlatformBrowser(this.platformId)) {
        window.location.assign(item.actionUrl);
      }

      return;
    }

    void this.router.navigateByUrl(item.actionUrl);
  }

  protected itemClass(type: string): string {
    const normalizedType = type.toLowerCase();
    const baseClass =
      'rounded-2xl border p-5 shadow-sm transition flex flex-col gap-4 md:flex-row md:items-center md:justify-between';

    if (normalizedType === 'critical') {
      return `${baseClass} border-red-200 bg-red-50`;
    }

    if (normalizedType === 'warning') {
      return `${baseClass} border-amber-200 bg-amber-50`;
    }

    if (normalizedType === 'success') {
      return `${baseClass} border-emerald-200 bg-emerald-50`;
    }

    return `${baseClass} border-blue-200 bg-blue-50`;
  }

  protected iconClass(type: string): string {
    const normalizedType = type.toLowerCase();
    const baseClass = 'grid size-11 shrink-0 place-items-center rounded-2xl';

    if (normalizedType === 'critical') {
      return `${baseClass} bg-red-100 text-red-700`;
    }

    if (normalizedType === 'warning') {
      return `${baseClass} bg-amber-100 text-amber-700`;
    }

    if (normalizedType === 'success') {
      return `${baseClass} bg-emerald-100 text-emerald-700`;
    }

    return `${baseClass} bg-blue-100 text-blue-700`;
  }
}
