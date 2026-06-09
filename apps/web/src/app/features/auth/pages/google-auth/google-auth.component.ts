import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractApiErrors } from '../../../../core/errors/api-response-error';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';
import { GoogleAuthButtonComponent } from '../../components/google-auth-button/google-auth-button.component';

@Component({
  selector: 'app-google-auth',
  standalone: true,
  imports: [AuthFormShellComponent, GoogleAuthButtonComponent, MatProgressSpinnerModule],
  templateUrl: './google-auth.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoogleAuthComponent {
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);

  protected continueWithGoogle(idToken: string): void {
    if (this.isSubmitting()) {
      return;
    }

    this.errorMessages.set([]);
    this.isSubmitting.set(true);

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/app/dashboard';

    this.authSession
      .googleLogin({ idToken })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => void this.router.navigateByUrl(returnUrl),
        error: error => this.errorMessages.set(extractApiErrors(error))
      });
  }

  protected handleGoogleFailure(message: string): void {
    this.errorMessages.set([message]);
  }
}
