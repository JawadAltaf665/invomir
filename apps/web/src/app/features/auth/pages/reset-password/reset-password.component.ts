import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractApiErrors } from '../../../../core/errors/api-response-error';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    AuthFormShellComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './reset-password.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly form = this.fb.nonNullable.group({
    newPassword: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(128), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]
    ],
    confirmPassword: ['', [Validators.required]]
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.errorMessages.set(['Reset token is missing.']);
      return;
    }

    const value = this.form.getRawValue();

    if (value.newPassword !== value.confirmPassword) {
      this.errorMessages.set(['Passwords do not match.']);
      return;
    }

    this.errorMessages.set([]);
    this.successMessage.set(null);
    this.isSubmitting.set(true);

    this.authSession
      .resetPassword({ token: this.token, newPassword: value.newPassword })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: message => this.successMessage.set(message),
        error: error => this.errorMessages.set(extractApiErrors(error))
      });
  }
}
