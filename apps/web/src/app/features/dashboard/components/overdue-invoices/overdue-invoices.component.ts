import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DashboardOverdueSummary, DashboardTone } from '../../models/dashboard.models';

@Component({
  selector: 'app-overdue-invoices',
  standalone: true,
  templateUrl: './overdue-invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverdueInvoicesComponent {
  readonly summary = input.required<DashboardOverdueSummary>();

  protected readonly progressClass = computed(() => this.toProgressClass(this.summary().tone));
  protected readonly badgeClass = computed(() => this.toBadgeClass(this.summary().tone));

  private toProgressClass(tone: DashboardTone): string {
    const classByTone: Record<DashboardTone, string> = {
      neutral: 'h-full rounded-xl bg-neutral-300 transition-all duration-200',
      primary: 'h-full rounded-xl bg-primary transition-all duration-200',
      success: 'h-full rounded-xl bg-emerald-500 transition-all duration-200',
      warning: 'h-full rounded-xl bg-amber-500 transition-all duration-200',
      danger: 'h-full rounded-xl bg-red-500 transition-all duration-200',
    };

    return classByTone[tone];
  }

  private toBadgeClass(tone: DashboardTone): string {
    const classByTone: Record<DashboardTone, string> = {
      neutral: 'rounded-xl bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600',
      primary: 'rounded-xl bg-primary/10 px-2 py-1 text-xs font-medium text-primary',
      success: 'rounded-xl bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700',
      warning: 'rounded-xl bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700',
      danger: 'rounded-xl bg-red-50 px-2 py-1 text-xs font-medium text-red-700',
    };

    return classByTone[tone];
  }
}
