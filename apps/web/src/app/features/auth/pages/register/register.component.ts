import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Router } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { SupportedCurrency, supportedCurrencies } from '../../../../core/auth/auth.models';
import { extractApiErrors } from '../../../../core/errors/api-response-error';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';
import { GoogleAuthButtonComponent } from '../../components/google-auth-button/google-auth-button.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    AuthFormShellComponent,
    GoogleAuthButtonComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
    LucideEye,
    LucideEyeOff
  ],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);

  protected readonly currencies = supportedCurrencies;
  protected readonly isSubmitting = signal(false);
  protected readonly isGoogleSubmitting = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);
  protected readonly isPasswordVisible = signal(false);
  protected readonly isConfirmPasswordVisible = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    businessName: ['', [Validators.required, Validators.maxLength(200)]],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.maxLength(128), Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)]
    ],
    confirmPassword: ['', [Validators.required]],
    currency: ['USD' as SupportedCurrency, [Validators.required]],
    taxPercent: [0, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    if (value.password !== value.confirmPassword) {
      this.errorMessages.set(['Passwords do not match.']);
      return;
    }

    this.errorMessages.set([]);
    this.isSubmitting.set(true);

    this.authSession
      .register({
        businessName: value.businessName,
        firstName: value.firstName,
        lastName: value.lastName,
        email: value.email,
        password: value.password,
        currency: value.currency,
        taxPercent: Number(value.taxPercent)
      })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/app/dashboard']),
        error: error => this.errorMessages.set(extractApiErrors(error))
      });
  }

  protected continueWithGoogle(idToken: string): void {
    if (this.isSubmitting() || this.isGoogleSubmitting()) {
      return;
    }

    this.errorMessages.set([]);
    this.isGoogleSubmitting.set(true);

    this.authSession
      .googleLogin({ idToken })
      .pipe(finalize(() => this.isGoogleSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/app/dashboard']),
        error: error => this.errorMessages.set(extractApiErrors(error))
      });
  }

  protected handleGoogleFailure(message: string): void {
    this.errorMessages.set([message]);
  }

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update(isVisible => !isVisible);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.isConfirmPasswordVisible.update(isVisible => !isVisible);
  }
}
