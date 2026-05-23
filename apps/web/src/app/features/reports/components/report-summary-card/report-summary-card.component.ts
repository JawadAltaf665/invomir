import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ReportSummaryCardView } from '../../models/report.models';
import { reportToneDotClass } from '../../utils/report-formatters';

@Component({
  selector: 'app-report-summary-card',
  standalone: true,
  templateUrl: './report-summary-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportSummaryCardComponent {
  readonly card = input.required<ReportSummaryCardView>();

  protected readonly toneClass = computed(() => reportToneDotClass(this.card().tone));
}
