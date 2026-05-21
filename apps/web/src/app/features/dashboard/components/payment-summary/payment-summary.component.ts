import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DashboardPaymentSummary } from '../../models/dashboard.models';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  templateUrl: './payment-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSummaryComponent {
  readonly summary = input.required<DashboardPaymentSummary>();
}
