import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthFormShellComponent } from '../../../auth/components/auth-form-shell/auth-form-shell.component';
import { TeamStore } from '../../store/team.store';

@Component({
  selector: 'app-accept-team-invitation',
  standalone: true,
  imports: [
    AuthFormShellComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './accept-team-invitation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcceptTeamInvitationComponent {
  protected readonly teamStore = inject(TeamStore);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  protected readonly localErrorMessages = signal<readonly string[]>([]);
  protected readonly token =
    this.route.snapshot.paramMap.get('token') ?? this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/),
      ],
    ],
    confirmPassword: ['', [Validators.required]],
  });

  protected submit(): void {
    if (this.form.invalid || this.teamStore.isAcceptingInvitation()) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.token) {
      this.localErrorMessages.set(['Invitation token is missing.']);
      return;
    }

    const value = this.form.getRawValue();

    if (value.password !== value.confirmPassword) {
      this.localErrorMessages.set(['Passwords do not match.']);
      return;
    }

    this.localErrorMessages.set([]);

    this.teamStore
      .acceptInvitation(this.token, {
        firstName: value.firstName,
        lastName: value.lastName,
        password: value.password,
      })
      .subscribe({
        error: () => undefined,
      });
  }
}
