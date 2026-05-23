import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { LucideMailPlus } from '@lucide/angular';

import { InviteTeamMemberRequest, TeamRole, teamRoleOptions } from '../../models/team.models';
import { formatRole } from '../../utils/team-formatters';

@Component({
  selector: 'app-team-invite-card',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
    LucideMailPlus,
  ],
  templateUrl: './team-invite-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamInviteCardComponent {
  readonly canInvite = input(false);
  readonly disabledReason = input<string | null>(null);
  readonly isSubmitting = input(false);
  readonly errorMessages = input<readonly string[]>([]);
  readonly successMessage = input('');
  readonly inviteRequested = output<InviteTeamMemberRequest>();

  protected readonly roleOptions = teamRoleOptions;
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    role: ['member' as TeamRole, [Validators.required]],
  });

  constructor() {
    effect(() => {
      if (this.canInvite() && !this.isSubmitting()) {
        this.form.enable({ emitEvent: false });
        return;
      }

      this.form.disable({ emitEvent: false });
    });
  }

  protected submit(): void {
    if (!this.canInvite() || this.isSubmitting() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.inviteRequested.emit({
      email: value.email.trim(),
      role: value.role,
    });
  }

  protected roleLabel(role: TeamRole): string {
    return formatRole(role);
  }
}
