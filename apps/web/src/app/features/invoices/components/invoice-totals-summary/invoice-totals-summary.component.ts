import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { TranslationService } from '../../../../core/i18n/translation.service';
import { formatInvoiceCurrency } from '../../utils/invoice-formatters';

export interface InvoiceTotalsSummary {
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
}

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-invoice-totals-summary',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [TranslatePipe],
  templateUrl: './invoice-totals-summary.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceTotalsSummaryComponent {
  private readonly translation = inject(TranslationService);
  readonly totals = input.required<InvoiceTotalsSummary>();
  readonly currency = input.required<string>();

  protected readonly subtotal = computed(() =>
    formatInvoiceCurrency(this.totals().subtotal, this.currency(), this.translation.language()),
  );
  protected readonly discount = computed(() =>
    formatInvoiceCurrency(
      this.totals().discountAmount,
      this.currency(),
      this.translation.language(),
    ),
  );
  protected readonly tax = computed(() =>
    formatInvoiceCurrency(this.totals().taxAmount, this.currency(), this.translation.language()),
  );
  protected readonly total = computed(() =>
    formatInvoiceCurrency(this.totals().total, this.currency(), this.translation.language()),
  );
}
