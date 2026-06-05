import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DashboardPaymentSummary } from '../../models/dashboard.models';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [TranslatePipe],
  templateUrl: './payment-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSummaryComponent {
  readonly summary = input.required<DashboardPaymentSummary>();
}
