import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { formatInvoiceCurrency } from '../../utils/invoice-formatters';

export interface InvoiceTotalsSummary {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

@Component({
  selector: 'app-invoice-totals-summary',
  standalone: true,
  host: {
    class: 'block',
  },
  templateUrl: './invoice-totals-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceTotalsSummaryComponent {
  readonly totals = input.required<InvoiceTotalsSummary>();
  readonly currency = input.required<string>();

  protected readonly subtotal = computed(() =>
    formatInvoiceCurrency(this.totals().subtotal, this.currency()),
  );
  protected readonly discount = computed(() =>
    formatInvoiceCurrency(this.totals().discountAmount, this.currency()),
  );
  protected readonly tax = computed(() =>
    formatInvoiceCurrency(this.totals().taxAmount, this.currency()),
  );
  protected readonly total = computed(() =>
    formatInvoiceCurrency(this.totals().total, this.currency()),
  );
}
