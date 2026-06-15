import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideExternalLink,
  LucideFileText,
  LucideRefreshCcw,
} from '@lucide/angular';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { permissions } from '../../../../core/permissions/permissions';
import { AdminUserBadgeComponent } from '../../components/admin-user-badge/admin-user-badge.component';
import { PlanEditorComponent } from '../../components/plan-editor/plan-editor.component';
import { RoleEditorComponent } from '../../components/role-editor/role-editor.component';
import { TrialEditorComponent } from '../../components/trial-editor/trial-editor.component';
import { AdminPlan, AdminRole, AdminUserDetailDto } from '../../models/admin-user.models';
import { AdminUserDetailStore } from '../../store/admin-user-detail.store';
import {
  formatAdminAmount,
  formatAdminUserName,
  formatCurrencyAmount,
  formatInitials,
  formatNullableDate,
  formatNullableDateTime,
  formatPlanLabel,
  formatRoleLabel,
  formatStatusLabel,
  formatTrialEnds,
} from '../../utils/admin-user-formatters';

@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [
    MatButtonModule,
    RouterLink,
    AdminUserBadgeComponent,
    PlanEditorComponent,
    RoleEditorComponent,
    TrialEditorComponent,
    LucideArrowLeft,
    LucideExternalLink,
    LucideFileText,
    LucideRefreshCcw,
  ],
  providers: [AdminUserDetailStore],
  templateUrl: './admin-user-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserDetailsComponent implements OnInit {
  protected readonly adminUserStore = inject(AdminUserDetailStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly route = inject(ActivatedRoute);

  protected readonly userId = signal<string | null>(null);
  protected readonly canManageUsers = computed(() =>
    this.authSession.hasPermission(permissions.system.users.manage),
  );

  protected readonly userName = computed(() => {
    const user = this.adminUserStore.user();

    return user ? formatAdminUserName(user.firstName, user.lastName, user.email) : 'Admin user';
  });

  protected readonly userInitials = computed(() => {
    const user = this.adminUserStore.user();

    return user ? formatInitials(user.firstName, user.lastName, user.email) : 'IM';
  });

  protected readonly formatPlanLabel = formatPlanLabel;
  protected readonly formatRoleLabel = formatRoleLabel;
  protected readonly formatStatusLabel = formatStatusLabel;
  protected readonly formatNullableDate = formatNullableDate;
  protected readonly formatNullableDateTime = formatNullableDateTime;
  protected readonly formatTrialEnds = formatTrialEnds;
  protected readonly formatAdminAmount = formatAdminAmount;
  protected readonly formatCurrencyAmount = formatCurrencyAmount;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    this.userId.set(id);

    if (id) {
      this.adminUserStore.loadUser(id);
    }
  }

  protected refresh(): void {
    const id = this.userId();

    if (id) {
      this.adminUserStore.clearActionMessages();
      this.adminUserStore.loadUser(id);
    }
  }

  protected updatePlan(plan: AdminPlan): void {
    const id = this.userId();

    if (id) {
      this.adminUserStore.updatePlan(id, plan);
    }
  }

  protected updateRole(role: AdminRole): void {
    const id = this.userId();

    if (id) {
      this.adminUserStore.updateRole(id, role);
    }
  }

  protected updateTrial(trialEndsAt: string): void {
    const id = this.userId();

    if (id) {
      this.adminUserStore.updateTrial(id, trialEndsAt);
    }
  }

  protected activeTone(user: AdminUserDetailDto): 'success' | 'danger' {
    return user.isActive ? 'success' : 'danger';
  }

  protected emailTone(user: AdminUserDetailDto): 'success' | 'warning' {
    return user.emailVerified ? 'success' : 'warning';
  }

  protected trialTone(user: AdminUserDetailDto): 'info' | 'neutral' {
    return user.isTrialActive ? 'info' : 'neutral';
  }
}
