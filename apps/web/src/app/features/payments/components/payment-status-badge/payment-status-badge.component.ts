import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { paymentStatusClass, paymentStatusLabel } from '../../utils/payment-formatters';

@Component({
  selector: 'app-payment-status-badge',
  standalone: true,
  template: `<span [class]="badgeClass()">{{ label() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentStatusBadgeComponent {
  readonly status = input.required<string>();

  protected readonly label = computed(() => paymentStatusLabel(this.status()));
  protected readonly badgeClass = computed(() => paymentStatusClass(this.status()));
}
