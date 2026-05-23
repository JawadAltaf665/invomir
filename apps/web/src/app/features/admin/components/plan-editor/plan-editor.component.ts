import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LucideSave } from '@lucide/angular';

import { AdminPlan, adminPlans } from '../../models/admin-user.models';
import { formatPlanLabel, normalizeAdminPlan } from '../../utils/admin-user-formatters';

@Component({
  selector: 'app-plan-editor',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule, LucideSave],
  templateUrl: './plan-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanEditorComponent {
  private readonly fb = inject(FormBuilder);

  readonly currentPlan = input.required<string>();
  readonly canManage = input(false);
  readonly isSaving = input(false);

  readonly planSubmitted = output<AdminPlan>();

  protected readonly planOptions = adminPlans.map((plan) => ({
    value: plan,
    label: formatPlanLabel(plan),
  }));

  protected readonly form = this.fb.nonNullable.group({
    plan: this.fb.nonNullable.control<AdminPlan>('free'),
  });

  constructor() {
    effect(() => {
      this.form.patchValue(
        {
          plan: normalizeAdminPlan(this.currentPlan()),
        },
        { emitEvent: false },
      );
    });
  }

  protected submitPlan(): void {
    if (!this.canManage() || this.isSaving()) {
      return;
    }

    this.planSubmitted.emit(this.form.controls.plan.value);
  }
}
