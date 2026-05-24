import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractApiErrors } from '../../../../core/errors/api-response-error';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    AuthFormShellComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink,
    LucideEye,
    LucideEyeOff
  ],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);
  protected readonly isPasswordVisible = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    password: ['', [Validators.required]]
  });

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessages.set([]);
    this.isSubmitting.set(true);

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/app/dashboard';

    this.authSession
      .login(this.form.getRawValue())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(returnUrl),
        error: error => this.errorMessages.set(extractApiErrors(error))
      });
  }

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update(isVisible => !isVisible);
  }
}
