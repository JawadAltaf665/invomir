import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideSave } from '@lucide/angular';

import { ChangePasswordRequest } from '../../models/settings.models';

type PasswordFormGroup = FormGroup<{
  currentPassword: FormControl<string>;
  newPassword: FormControl<string>;
  confirmPassword: FormControl<string>;
}>;

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-password-change-form',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [
    TranslatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    LucideSave,
  ],
  templateUrl: './password-change-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordChangeFormComponent {
  readonly canManage = input(false);
  readonly isSaving = input(false);
  readonly errorMessages = input<readonly string[]>([]);
  readonly successMessage = input('');

  readonly passwordChangeRequested = output<ChangePasswordRequest>();

  protected readonly form: PasswordFormGroup = new FormGroup(
    {
      currentPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
          Validators.pattern(/[A-Z]/),
          Validators.pattern(/[0-9]/),
        ],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [passwordsMatchValidator()] },
  );

  protected submit(): void {
    if (!this.canManage() || this.isSaving() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.passwordChangeRequested.emit({
      currentPassword: value.currentPassword,
      newPassword: value.newPassword,
    });
  }
}

function passwordsMatchValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const currentPassword = control.get('currentPassword')?.value as string | undefined;
    const newPassword = control.get('newPassword')?.value as string | undefined;
    const confirmPassword = control.get('confirmPassword')?.value as string | undefined;

    if (!newPassword || !confirmPassword) {
      return null;
    }

    if (newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }

    if (currentPassword && newPassword === currentPassword) {
      return { passwordUnchanged: true };
    }

    return null;
  };
}
