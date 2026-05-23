import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideCalendarDays, LucideCreditCard } from '@lucide/angular';

import { CurrentSubscriptionDto } from '../../models/subscription.models';
import {
  formatBillingCurrency,
  formatBillingDate,
  formatBillingLabel,
  formatTrialDaysRemaining,
} from '../../utils/subscription-formatters';
import { BillingStatusBadgeComponent } from '../billing-status-badge/billing-status-badge.component';

@Component({
  selector: 'app-current-plan-card',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [BillingStatusBadgeComponent, LucideCalendarDays, LucideCreditCard],
  templateUrl: './current-plan-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentPlanCardComponent {
  readonly subscription = input<CurrentSubscriptionDto | null>(null);
  readonly isLoading = input(false);

  protected readonly formatBillingCurrency = formatBillingCurrency;
  protected readonly formatBillingDate = formatBillingDate;
  protected readonly formatBillingLabel = formatBillingLabel;
  protected readonly formatTrialDaysRemaining = formatTrialDaysRemaining;
}
