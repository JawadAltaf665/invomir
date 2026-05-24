import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    LucideRotateCcw,
    LucideSearch,
  ],
  templateUrl: './audit-log-filters.component.html',
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
    from: this.fb.nonNullable.control(''),
    to: this.fb.nonNullable.control(''),
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
          from: filters.from,
          to: filters.to,
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

    this.filtersChange.emit({
      ...this.form.getRawValue(),
      page: 1,
    });
  }

  protected resetFilters(): void {
    this.resetRequested.emit();
  }
}
