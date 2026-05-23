import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LucideRotateCcw, LucideSearch } from '@lucide/angular';

import { AdminUserListFilters } from '../../models/admin-user.models';

@Component({
  selector: 'app-admin-user-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LucideRotateCcw,
    LucideSearch,
  ],
  templateUrl: './admin-user-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserFiltersComponent {
  private readonly fb = inject(FormBuilder);

  readonly filters = input.required<AdminUserListFilters>();
  readonly isLoading = input(false);

  readonly filtersChange = output<Partial<AdminUserListFilters>>();
  readonly resetRequested = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    q: this.fb.nonNullable.control(''),
  });

  constructor() {
    effect(() => {
      this.form.patchValue({ q: this.filters().q }, { emitEvent: false });
    });
  }

  protected applyFilters(): void {
    this.filtersChange.emit({
      q: this.form.controls.q.value.trim(),
      page: 1,
    });
  }

  protected resetFilters(): void {
    this.resetRequested.emit();
  }
}
