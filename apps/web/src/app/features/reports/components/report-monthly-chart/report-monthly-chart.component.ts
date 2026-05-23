import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ReportChartMonthView } from '../../models/report.models';

@Component({
  selector: 'app-report-monthly-chart',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  templateUrl: './report-monthly-chart.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportMonthlyChartComponent {
  readonly months = input<readonly ReportChartMonthView[]>([]);
  readonly periodLabel = input('');
  readonly isEmpty = input(false);

  protected readonly legendItems = [
    { label: 'Paid', className: 'bg-emerald-500' },
    { label: 'Outstanding', className: 'bg-primary' },
    { label: 'Overdue', className: 'bg-red-500' },
  ];
}
