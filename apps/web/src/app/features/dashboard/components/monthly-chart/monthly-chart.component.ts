import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardRevenueBar, DashboardTone } from '../../models/dashboard.models';

interface DashboardRevenueBarView extends DashboardRevenueBar {
  barClass: string;
}

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-monthly-chart',
  standalone: true,
  imports: [TranslatePipe, RouterLink],
  host: {
    class: 'block h-full',
  },
  templateUrl: './monthly-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyChartComponent {
  readonly bars = input.required<readonly DashboardRevenueBar[]>();
  readonly allTimeRevenue = input.required<string>();
  readonly changeLabel = input.required<string>();

  protected readonly displayBars = computed<readonly DashboardRevenueBarView[]>(() =>
    this.bars().map((bar) => ({
      ...bar,
      barClass: this.toBarClass(bar.tone),
    })),
  );
  protected readonly hasRevenue = computed(() => this.bars().some((bar) => bar.value > 0));

  private toBarClass(tone: DashboardTone): string {
    const classByTone: Record<DashboardTone, string> = {
      neutral: 'w-12 rounded-t-xl bg-neutral-300 transition-all duration-200',
      primary: 'w-12 rounded-t-xl bg-primary transition-all duration-200',
      success: 'w-12 rounded-t-xl bg-emerald-500 transition-all duration-200',
      warning: 'w-12 rounded-t-xl bg-amber-500 transition-all duration-200',
      danger: 'w-12 rounded-t-xl bg-red-500 transition-all duration-200',
    };

    return classByTone[tone];
  }
}
