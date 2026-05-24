import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideRotateCcw, LucideSearch } from '@lucide/angular';

import { ReportFilters, reportMonthOptions, reportMonths } from '../../models/report.models';

@Component({
  selector: 'app-report-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    LucideRotateCcw,
    LucideSearch,
  ],
  templateUrl: './report-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFiltersComponent {
  private readonly fb = inject(FormBuilder);

  readonly filters = input.required<ReportFilters>();
  readonly isLoading = input(false);

  readonly filtersChange = output<Partial<ReportFilters>>();
  readonly resetRequested = output<void>();

  protected readonly monthOptions = reportMonthOptions;
  protected readonly calendarMonths = reportMonths;
  protected readonly currentYear = new Date().getFullYear();

  protected readonly form = this.fb.nonNullable.group({
    mode: this.fb.nonNullable.control<ReportFilters['mode']>('rolling'),
    months: this.fb.nonNullable.control(12, [Validators.min(1), Validators.max(24)]),
    year: this.fb.control<number | null>(null, [Validators.min(2000), Validators.max(2100)]),
    month: this.fb.control<number | null>(null, [Validators.min(1), Validators.max(12)]),
  });

  constructor() {
    effect(() => {
      const filters = this.filters();
      this.form.patchValue(
        {
          mode: filters.mode,
          months: filters.months,
          year: filters.year,
          month: filters.month,
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
    const year = value.mode === 'rolling' ? null : (value.year ?? this.currentYear);
    const month = value.mode === 'month' ? (value.month ?? new Date().getMonth() + 1) : null;

    this.filtersChange.emit({
      mode: value.mode,
      months: value.mode === 'rolling' ? value.months : value.mode === 'year' ? 12 : 1,
      year,
      month,
    });
  }

  protected resetFilters(): void {
    this.resetRequested.emit();
  }
}
