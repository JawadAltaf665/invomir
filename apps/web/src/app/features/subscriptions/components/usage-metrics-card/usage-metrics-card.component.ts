import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideGauge } from '@lucide/angular';

import { SubscriptionUsageMetricView } from '../../models/subscription.models';

@Component({
  selector: 'app-usage-metrics-card',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [LucideGauge],
  templateUrl: './usage-metrics-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsageMetricsCardComponent {
  readonly metrics = input<readonly SubscriptionUsageMetricView[]>([]);
  readonly isLoading = input(false);
}
