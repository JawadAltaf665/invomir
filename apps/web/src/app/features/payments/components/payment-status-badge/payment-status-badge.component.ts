import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { paymentStatusClass } from '../../utils/payment-formatters';
import { TranslationService } from '../../../../core/i18n/translation.service';

@Component({
  selector: 'app-payment-status-badge',
  standalone: true,
  template: `<span [class]="badgeClass()">{{ label() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentStatusBadgeComponent {
  readonly status = input.required<string>();
  private readonly translation = inject(TranslationService);

  protected readonly label = computed(() =>
    this.translation.translate(`paymentStatus.${this.status().trim().toLowerCase()}`),
  );
  protected readonly badgeClass = computed(() => paymentStatusClass(this.status()));
}
