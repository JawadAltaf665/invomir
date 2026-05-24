import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideBarChart3 } from '@lucide/angular';

import { ReportMonthView } from '../../models/report.models';

@Component({
  selector: 'app-report-breakdown-table',
  standalone: true,
  imports: [LucideBarChart3],
  templateUrl: './report-breakdown-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportBreakdownTableComponent {
  readonly rows = input<readonly ReportMonthView[]>([]);
  readonly isLoading = input(false);

  protected readonly skeletonRows = [1, 2, 3, 4];
}
