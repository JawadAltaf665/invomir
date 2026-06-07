import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideRotateCcw, LucideSearch } from '@lucide/angular';

import {
  AuditActionFilter,
  AuditEntityFilter,
  AuditLogListFilters,
  auditActionFilters,
  auditEntityFilters,
} from '../../models/audit-log.models';
import { formatAuditLabel } from '../../utils/audit-log-formatters';

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-audit-log-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    LucideRotateCcw,
    LucideSearch,
  ],
  templateUrl: './audit-log-filters.component.html',
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogFiltersComponent {
  private readonly fb = inject(FormBuilder);

  readonly filters = input.required<AuditLogListFilters>();
  readonly isLoading = input(false);

  readonly filtersChange = output<Partial<AuditLogListFilters>>();
  readonly resetRequested = output<void>();

  protected readonly entityOptions = auditEntityFilters.map((entity) => ({
    value: entity,
    label: entity === 'all' ? 'All entities' : formatAuditLabel(entity),
  }));
  protected readonly actionOptions = auditActionFilters.map((action) => ({
    value: action,
    label: action === 'all' ? 'All actions' : formatAuditLabel(action),
  }));

  protected readonly form = this.fb.nonNullable.group({
    entityName: this.fb.nonNullable.control<AuditEntityFilter | string>('all'),
    action: this.fb.nonNullable.control<AuditActionFilter | string>('all'),
    entityId: this.fb.nonNullable.control('', Validators.pattern(guidPattern)),
    from: this.fb.control<Date | null>(null),
    to: this.fb.control<Date | null>(null),
    searchTerm: this.fb.nonNullable.control(''),
  });

  constructor() {
    effect(() => {
      const filters = this.filters();
      this.form.patchValue(
        {
          entityName: filters.entityName,
          action: filters.action,
          entityId: filters.entityId,
          from: this.toDate(filters.from),
          to: this.toDate(filters.to),
          searchTerm: filters.searchTerm,
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

    const rawValue = this.form.getRawValue();

    this.filtersChange.emit({
      entityName: rawValue.entityName,
      action: rawValue.action,
      entityId: rawValue.entityId,
      from: this.toFilterDate(rawValue.from),
      to: this.toFilterDate(rawValue.to),
      searchTerm: rawValue.searchTerm,
      page: 1,
    });
  }

  protected resetFilters(): void {
    this.resetRequested.emit();
  }

  private toDate(value: string): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toFilterDate(value: Date | null): string {
    if (!value || Number.isNaN(value.getTime())) {
      return '';
    }

    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
