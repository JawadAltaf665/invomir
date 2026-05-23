import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import {
  formatBillingStatusLabel,
  formatBillingStatusTone,
} from '../../utils/subscription-formatters';

@Component({
  selector: 'app-billing-status-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './billing-status-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingStatusBadgeComponent {
  readonly status = input('');
  readonly cancelAtPeriodEnd = input(false);

  protected readonly label = computed(() =>
    formatBillingStatusLabel(this.status(), this.cancelAtPeriodEnd()),
  );
  protected readonly tone = computed(() =>
    formatBillingStatusTone(this.status(), this.cancelAtPeriodEnd()),
  );
}
