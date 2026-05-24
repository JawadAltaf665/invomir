import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { DashboardAccountSummary } from '../../models/dashboard.models';

@Component({
  selector: 'app-subscription-status',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  templateUrl: './subscription-status.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionStatusComponent {
  readonly summary = input.required<DashboardAccountSummary>();
}
