import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideRotateCcw, LucideSearch } from '@lucide/angular';

import {
  InvoiceClientListItemDto,
  InvoiceListFilters,
  InvoiceStatus,
  invoiceStatuses,
} from '../../models/invoice.models';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { TranslationService } from '../../../../core/i18n/translation.service';

@Component({
  selector: 'app-invoice-filters',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [
    TranslatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    LucideRotateCcw,
    LucideSearch,
  ],
  templateUrl: './invoice-filters.component.html',
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceFiltersComponent {
  private readonly fb = inject(FormBuilder);
  private readonly translation = inject(TranslationService);

  readonly filters = input.required<InvoiceListFilters>();
  readonly clients = input<readonly InvoiceClientListItemDto[]>([]);
  readonly isLoading = input(false);
  readonly isClientFilterAvailable = input(false);

  readonly filtersChange = output<Partial<InvoiceListFilters>>();
  readonly resetRequested = output<void>();

  protected readonly statusOptions = computed(() =>
    invoiceStatuses.map((status) => ({
      value: status,
      label: this.translation.translate(`invoiceStatus.${status}`),
    })),
  );

  protected readonly form = this.fb.nonNullable.group(
    {
      searchTerm: [''],
      status: [''],
      clientId: [''],
      from: this.fb.control<Date | null>(null),
      to: this.fb.control<Date | null>(null),
      minAmount: ['', Validators.min(0)],
      maxAmount: ['', Validators.min(0)],
    },
    {
      validators: [this.dateRangeValidator, this.amountRangeValidator],
    },
  );

  constructor() {
    effect(() => {
      const filters = this.filters();
      this.form.patchValue(
        {
          searchTerm: filters.searchTerm ?? '',
          status: filters.status ?? '',
          clientId: filters.clientId ?? '',
          from: this.toDate(filters.from),
          to: this.toDate(filters.to),
          minAmount: filters.minAmount?.toString() ?? '',
          maxAmount: filters.maxAmount?.toString() ?? '',
        },
        { emitEvent: false },
      );
    });
  }

  protected applyFilters(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.filtersChange.emit({
      searchTerm: value.searchTerm,
      status: (value.status || null) as InvoiceStatus | null,
      clientId: value.clientId || null,
      from: this.toFilterDate(value.from),
      to: this.toFilterDate(value.to),
      minAmount: this.toAmountFilter(value.minAmount),
      maxAmount: this.toAmountFilter(value.maxAmount),
      page: 1,
    });
  }

  protected resetFilters(): void {
    this.resetRequested.emit();
  }

  private toAmountFilter(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  private toDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toFilterDate(value: Date | null): string | null {
    if (!value || Number.isNaN(value.getTime())) {
      return null;
    }

    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const from = control.get('from')?.value as Date | null;
    const to = control.get('to')?.value as Date | null;

    if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return null;
    }

    return from <= to ? null : { dateRange: true };
  }

  private amountRangeValidator(control: AbstractControl): ValidationErrors | null {
    const minAmount = InvoiceFiltersComponent.parseAmount(control.get('minAmount')?.value);
    const maxAmount = InvoiceFiltersComponent.parseAmount(control.get('maxAmount')?.value);

    if (minAmount === null || maxAmount === null) {
      return null;
    }

    return minAmount <= maxAmount ? null : { amountRange: true };
  }

  private static parseAmount(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
