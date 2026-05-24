import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractApiErrors } from '../../../../core/errors/api-response-error';
import { AuthFormShellComponent } from '../../components/auth-form-shell/auth-form-shell.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [AuthFormShellComponent, MatButtonModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: './verify-email.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VerifyEmailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly authSession = inject(AuthSessionService);

  protected readonly isLoading = signal(true);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly errorMessages = signal<readonly string[]>([]);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isLoading.set(false);
      this.errorMessages.set(['Verification token is missing.']);
      return;
    }

    this.authSession.verifyEmail({ token }).subscribe({
      next: message => {
        this.successMessage.set(message);
        this.isLoading.set(false);
      },
      error: error => {
        this.errorMessages.set(extractApiErrors(error));
        this.isLoading.set(false);
      }
    });
  }
}
