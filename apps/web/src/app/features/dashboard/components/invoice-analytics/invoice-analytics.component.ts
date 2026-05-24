import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DashboardStatusMetric, DashboardTone } from '../../models/dashboard.models';

interface DashboardStatusMetricView extends DashboardStatusMetric {
  barClass: string;
  badgeClass: string;
}

@Component({
  selector: 'app-invoice-analytics',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  templateUrl: './invoice-analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceAnalyticsComponent {
  readonly metrics = input.required<readonly DashboardStatusMetric[]>();
  readonly totalCount = input.required<number>();

  protected readonly displayMetrics = computed<readonly DashboardStatusMetricView[]>(() =>
    this.metrics().map((metric) => ({
      ...metric,
      barClass: this.toBarClass(metric.tone),
      badgeClass: this.toBadgeClass(metric.tone),
    })),
  );

  private toBarClass(tone: DashboardTone): string {
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
