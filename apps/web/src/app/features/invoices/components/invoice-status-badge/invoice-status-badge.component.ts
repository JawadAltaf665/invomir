import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { InvoiceStatus } from '../../models/invoice.models';
import { invoiceStatusClass } from '../../utils/invoice-formatters';
import { TranslationService } from '../../../../core/i18n/translation.service';

@Component({
  selector: 'app-invoice-status-badge',
  standalone: true,
  template: `<span [class]="badgeClass()">{{ label() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceStatusBadgeComponent {
  readonly status = input.required<InvoiceStatus>();
  private readonly translation = inject(TranslationService);

  protected readonly label = computed(() =>
    this.translation.translate(`invoiceStatus.${this.status()}`),
  );
  protected readonly badgeClass = computed(() => invoiceStatusClass(this.status()));
}
