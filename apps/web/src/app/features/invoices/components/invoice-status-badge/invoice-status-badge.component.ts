import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { InvoiceStatus } from '../../models/invoice.models';
import { invoiceStatusClass, invoiceStatusLabel } from '../../utils/invoice-formatters';

@Component({
  selector: 'app-invoice-status-badge',
  standalone: true,
  template: `<span [class]="badgeClass()">{{ label() }}</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceStatusBadgeComponent {
  readonly status = input.required<InvoiceStatus>();

  protected readonly label = computed(() => invoiceStatusLabel(this.status()));
  protected readonly badgeClass = computed(() => invoiceStatusClass(this.status()));
}
