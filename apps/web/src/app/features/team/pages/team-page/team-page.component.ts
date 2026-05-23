import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LucideRefreshCcw, LucideShieldCheck, LucideUserPlus, LucideUsers } from '@lucide/angular';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { permissions } from '../../../../core/permissions/permissions';
import { TeamInvitationTableComponent } from '../../components/team-invitation-table/team-invitation-table.component';
import { TeamInviteCardComponent } from '../../components/team-invite-card/team-invite-card.component';
import { TeamMemberTableComponent } from '../../components/team-member-table/team-member-table.component';
import {
  InviteTeamMemberRequest,
  TeamInvitationView,
  TeamMemberView,
  TeamRole,
} from '../../models/team.models';
import { TeamStore } from '../../store/team.store';
import { formatRole } from '../../utils/team-formatters';

@Component({
  selector: 'app-team-page',
  standalone: true,
  imports: [
    MatButtonModule,
    TeamInvitationTableComponent,
    TeamInviteCardComponent,
    TeamMemberTableComponent,
    LucideRefreshCcw,
    LucideShieldCheck,
    LucideUserPlus,
    LucideUsers,
  ],
  templateUrl: './team-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPageComponent implements OnInit {
  protected readonly teamStore = inject(TeamStore);
  protected readonly authSession = inject(AuthSessionService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly canViewTeam = computed(() =>
    this.authSession.hasPermission(permissions.team.manage),
  );
  protected readonly isOwner = computed(() => this.authSession.role() === 'owner');
  protected readonly isBusinessPlan = computed(
    () => this.authSession.user()?.plan?.toString().toLowerCase() === 'business',
  );
  protected readonly canManageTeam = computed(() => this.canViewTeam() && this.isOwner());
  protected readonly inviteDisabledReason = computed(() => {
    if (!this.canViewTeam()) {
      return 'You do not have permission to manage team access.';
    }

    if (!this.isOwner()) {
      return 'Only the workspace owner can invite, remove, or change team member roles.';
    }

    if (!this.isBusinessPlan()) {
      return 'Team seats require the Business plan.';
    }

    if (this.teamStore.seatUsage().remaining <= 0) {
      return 'Business plan includes 3 total seats. Remove a member or cancel an invitation before inviting another user.';
    }

    return null;
  });
  protected readonly canInvite = computed(() => this.inviteDisabledReason() === null);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.teamStore.loadTeam();
  }

  protected refresh(): void {
    this.teamStore.loadTeam();
  }

  protected inviteMember(request: InviteTeamMemberRequest): void {
    this.teamStore.inviteMember(request).subscribe({
      error: () => undefined,
    });
  }

  protected changeMemberRole(event: { memberId: string; role: TeamRole }): void {
    this.teamStore.changeMemberRole(event.memberId, { role: event.role }).subscribe({
      error: () => undefined,
    });
  }

  protected removeMember(member: TeamMemberView): void {
    if (!this.confirm(`Remove ${member.fullName} from this workspace?`)) {
      return;
    }

    this.teamStore.removeMember(member.id).subscribe({
      error: () => undefined,
    });
  }

  protected cancelInvitation(invitation: TeamInvitationView): void {
    if (!this.confirm(`Cancel invitation for ${invitation.email}?`)) {
      return;
    }

    this.teamStore.cancelInvitation(invitation.id).subscribe({
      error: () => undefined,
    });
  }

  protected roleLabel(role: string | null): string {
    return role ? formatRole(role) : 'Unknown';
  }

  private confirm(message: string): boolean {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    return window.confirm(message);
  }
}
