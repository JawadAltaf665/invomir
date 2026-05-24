import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideChevronDown,
  LucideChevronUp,
  LucideMail,
  LucideTrash2,
} from '@lucide/angular';

import { TeamInvitationView } from '../../models/team.models';
import { TeamBadgeComponent } from '../team-badge/team-badge.component';

@Component({
  selector: 'app-team-invitation-table',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [
    MatButtonModule,
    MatMenuModule,
    TeamBadgeComponent,
    LucideChevronDown,
    LucideChevronUp,
    LucideMail,
    LucideTrash2,
  ],
  templateUrl: './team-invitation-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamInvitationTableComponent {
  readonly invitations = input.required<readonly TeamInvitationView[]>();
  readonly isLoading = input(false);
  readonly canManage = input(false);
  readonly activeInvitationId = input<string | null>(null);

  readonly cancelRequested = output<TeamInvitationView>();

  protected readonly skeletonRows = [1, 2] as const;
  protected readonly openActionInvitationId = signal<string | null>(null);
}
