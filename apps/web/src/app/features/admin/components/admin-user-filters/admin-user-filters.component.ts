import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { LucideRotateCcw, LucideSearch } from '@lucide/angular';

import {
  AdminPlan,
  AdminRole,
  AdminUserListFilters,
  adminPlans,
  adminRoles,
} from '../../models/admin-user.models';
import { formatPlanLabel, formatRoleLabel } from '../../utils/admin-user-formatters';

@Component({
  selector: 'app-admin-user-filters',
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
  templateUrl: './admin-user-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserFiltersComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly roleOptions = adminRoles.map((role) => ({
    value: role,
    label: formatRoleLabel(role),
  }));
  protected readonly planOptions = adminPlans.map((plan) => ({
    value: plan,
    label: formatPlanLabel(plan),
  }));

  readonly filters = input.required<AdminUserListFilters>();
  readonly isLoading = input(false);

  readonly filtersChange = output<Partial<AdminUserListFilters>>();
  readonly resetRequested = output<void>();

  protected readonly form = this.fb.nonNullable.group({
    q: this.fb.nonNullable.control(''),
    role: this.fb.nonNullable.control<AdminRole | ''>(''),
    plan: this.fb.nonNullable.control<AdminPlan | ''>(''),
    isActive: this.fb.nonNullable.control<boolean | ''>(''),
    emailVerified: this.fb.nonNullable.control<boolean | ''>(''),
    isTrialActive: this.fb.nonNullable.control<boolean | ''>(''),
    hasStripeCustomer: this.fb.nonNullable.control<boolean | ''>(''),
  });

  constructor() {
    effect(() => {
      const filters = this.filters();
      this.form.patchValue(
        {
          q: filters.q,
          role: filters.role,
          plan: filters.plan,
          isActive: filters.isActive,
          emailVerified: filters.emailVerified,
          isTrialActive: filters.isTrialActive,
          hasStripeCustomer: filters.hasStripeCustomer,
        },
        { emitEvent: false },
      );
    });
  }

  protected applyFilters(): void {
    const value = this.form.getRawValue();

    this.filtersChange.emit({
      q: value.q.trim(),
      role: value.role,
      plan: value.plan,
      isActive: value.isActive,
      emailVerified: value.emailVerified,
      isTrialActive: value.isTrialActive,
      hasStripeCustomer: value.hasStripeCustomer,
      page: 1,
    });
  }

  protected resetFilters(): void {
    this.resetRequested.emit();
  }
}
