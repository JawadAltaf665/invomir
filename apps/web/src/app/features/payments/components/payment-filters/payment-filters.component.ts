import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LucideRotateCcw, LucideSearch } from '@lucide/angular';

import {
  PaymentListFilters,
  PaymentStatusFilter,
  paymentStatuses,
} from '../../models/payment.models';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';

@Component({
  selector: 'app-payment-filters',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [
    TranslatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LucideRotateCcw,
    LucideSearch,
  ],
  templateUrl: './payment-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentFiltersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly translation = inject(TranslationService);

  readonly filters = input.required<PaymentListFilters>();
  readonly isLoading = input(false);

  readonly filtersChange = output<Partial<PaymentListFilters>>();
  readonly resetRequested = output<void>();

  protected readonly statusOptions = computed(() =>
    paymentStatuses.map((status) => ({
      value: status,
      label:
        status === 'all'
          ? this.translation.translate('payments.allPayments')
          : this.translation.translate(`paymentStatus.${status}`),
    })),
  );

  protected readonly form = this.fb.nonNullable.group({
    searchTerm: [''],
  });

  constructor() {
    effect(() => {
      this.form.patchValue(
        {
          searchTerm: this.filters().searchTerm ?? '',
        },
        { emitEvent: false },
      );
    });
  }

  protected selectStatus(status: PaymentStatusFilter): void {
    if (this.filters().status === status || this.isLoading()) {
      return;
    }

    this.filtersChange.emit({ status, page: 1 });
  }

  protected applySearch(): void {
    this.filtersChange.emit({
      searchTerm: this.form.controls.searchTerm.value,
    });
  }

  protected resetFilters(): void {
    this.resetRequested.emit();
  }
}
