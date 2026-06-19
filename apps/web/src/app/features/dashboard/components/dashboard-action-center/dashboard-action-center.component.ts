import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import {
  LucideAlertTriangle,
  LucideArrowRight,
  LucideCheckCircle2,
  LucideInfo,
  LucideShieldAlert,
  LucideX,
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
    LucideX,
  ],
  templateUrl: './dashboard-action-center.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardActionCenterComponent {
  readonly items = input.required<readonly DashboardActionItemDto[]>();

  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private transitionTimer: number | null = null;

  protected readonly hiddenItemIds = signal<readonly string[]>([]);
  protected readonly activeIndex = signal(0);
  protected readonly isTransitioning = signal(false);
  protected readonly visibleItems = computed(() => {
    const hiddenItemIds = new Set(this.hiddenItemIds());
    return this.items().filter((item) => !hiddenItemIds.has(item.id));
  });
  protected readonly activeItem = computed(() => {
    const visibleItems = this.visibleItems();
    return visibleItems[this.activeIndex()] ?? visibleItems[0] ?? null;
  });

  constructor() {
    effect(() => {
      const visibleItemsLength = this.visibleItems().length;
      if (this.activeIndex() >= visibleItemsLength) {
        this.activeIndex.set(0);
      }
    });

    if (isPlatformBrowser(this.platformId)) {
      const rotationTimer = window.setInterval(() => this.rotateItem(), 3000);
      this.destroyRef.onDestroy(() => {
        window.clearInterval(rotationTimer);

        if (this.transitionTimer !== null) {
          window.clearTimeout(this.transitionTimer);
        }
      });
    }
  }

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

  protected dismissItem(item: DashboardActionItemDto, event: MouseEvent): void {
    event.stopPropagation();
    this.hiddenItemIds.update((hiddenItemIds) => [...hiddenItemIds, item.id]);
  }

  protected itemClass(type: string): string {
    const normalizedType = type.toLowerCase();
    const baseClass =
      'rounded-2xl border p-5 shadow-sm transition-all duration-200 ease-out flex flex-col gap-4 md:flex-row md:items-center md:justify-between';

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

  private rotateItem(): void {
    const visibleItemsLength = this.visibleItems().length;

    if (visibleItemsLength <= 1 || this.isTransitioning()) {
      return;
    }

    this.isTransitioning.set(true);
    this.transitionTimer = window.setTimeout(() => {
      this.activeIndex.update((activeIndex) => (activeIndex + 1) % visibleItemsLength);
      this.isTransitioning.set(false);
      this.transitionTimer = null;
    }, 180);
  }
}
