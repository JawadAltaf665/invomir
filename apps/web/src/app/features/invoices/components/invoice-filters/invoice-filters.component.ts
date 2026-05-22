import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
import { invoiceStatusLabel } from '../../utils/invoice-formatters';

@Component({
  selector: 'app-invoice-filters',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    LucideRotateCcw,
    LucideSearch,
  ],
  templateUrl: './invoice-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceFiltersComponent {
  private readonly fb = inject(FormBuilder);

  readonly filters = input.required<InvoiceListFilters>();
  readonly clients = input<readonly InvoiceClientListItemDto[]>([]);
  readonly isLoading = input(false);
  readonly isClientFilterAvailable = input(false);

  readonly filtersChange = output<Partial<InvoiceListFilters>>();
  readonly resetRequested = output<void>();

  protected readonly statusOptions = invoiceStatuses.map((status) => ({
    value: status,
    label: invoiceStatusLabel(status),
  }));

  protected readonly form = this.fb.nonNullable.group({
    searchTerm: [''],
    status: [''],
    clientId: [''],
    from: [''],
    to: [''],
  });

  constructor() {
    effect(() => {
      const filters = this.filters();
      this.form.patchValue(
        {
          searchTerm: filters.searchTerm ?? '',
          status: filters.status ?? '',
          clientId: filters.clientId ?? '',
          from: filters.from ?? '',
          to: filters.to ?? '',
        },
        { emitEvent: false },
      );
    });
  }

  protected applyFilters(): void {
    const value = this.form.getRawValue();

    this.filtersChange.emit({
      searchTerm: value.searchTerm,
      status: (value.status || null) as InvoiceStatus | null,
      clientId: value.clientId || null,
      from: value.from || null,
      to: value.to || null,
      page: 1,
    });
  }

  protected resetFilters(): void {
    this.resetRequested.emit();
  }
}
