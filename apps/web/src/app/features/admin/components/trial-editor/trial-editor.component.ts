import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LucideCalendarClock } from '@lucide/angular';

import {
  toDateInputValue,
  toTrialEndIso,
  tomorrowDateInputValue,
} from '../../utils/admin-user-formatters';

@Component({
  selector: 'app-trial-editor',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LucideCalendarClock,
  ],
  templateUrl: './trial-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialEditorComponent {
  private readonly fb = inject(FormBuilder);

  readonly trialEndsAt = input<string | null>(null);
  readonly canManage = input(false);
  readonly isSaving = input(false);

  readonly trialSubmitted = output<string>();

  protected readonly minTrialDate = tomorrowDateInputValue();

  protected readonly form = this.fb.nonNullable.group({
    trialEndsAt: this.fb.nonNullable.control('', Validators.required),
  });

  constructor() {
    effect(() => {
      this.form.patchValue(
        {
          trialEndsAt: toDateInputValue(this.trialEndsAt()),
        },
        { emitEvent: false },
      );
    });
  }

  protected submitTrial(): void {
    if (!this.canManage() || this.isSaving()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.trialSubmitted.emit(toTrialEndIso(this.form.controls.trialEndsAt.value));
  }
}
