import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import {
  LucideChevronDown,
  LucideChevronUp,
  LucideShieldCheck,
  LucideTrash2,
  LucideUsers,
} from '@lucide/angular';

import { TeamMemberView, TeamRole, teamRoleOptions } from '../../models/team.models';
import { TeamBadgeComponent } from '../team-badge/team-badge.component';

@Component({
  selector: 'app-team-member-table',
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
    LucideShieldCheck,
    LucideTrash2,
    LucideUsers,
  ],
  templateUrl: './team-member-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamMemberTableComponent {
  readonly members = input.required<readonly TeamMemberView[]>();
  readonly isLoading = input(false);
  readonly canManage = input(false);
  readonly activeMemberId = input<string | null>(null);

  readonly roleChangeRequested = output<{ memberId: string; role: TeamRole }>();
  readonly removeRequested = output<TeamMemberView>();

  protected readonly skeletonRows = [1, 2, 3] as const;
  protected readonly roleOptions = teamRoleOptions;
  protected readonly openActionMemberId = signal<string | null>(null);
}
