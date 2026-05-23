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
import { LucideRefreshCcw } from '@lucide/angular';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { permissions } from '../../../../core/permissions/permissions';
import { AdminUserFiltersComponent } from '../../components/admin-user-filters/admin-user-filters.component';
import { AdminUserTableComponent } from '../../components/admin-user-table/admin-user-table.component';
import { AdminUserListFilters } from '../../models/admin-user.models';
import { AdminUserListStore } from '../../store/admin-user-list.store';

@Component({
  selector: 'app-admin-user-list',
  standalone: true,
  imports: [MatButtonModule, AdminUserFiltersComponent, AdminUserTableComponent, LucideRefreshCcw],
  templateUrl: './admin-user-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserListComponent implements OnInit {
  protected readonly adminUserStore = inject(AdminUserListStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly canManageUsers = computed(() =>
    this.authSession.hasPermission(permissions.system.users.manage),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.adminUserStore.loadUsers();
  }

  protected refresh(): void {
    this.adminUserStore.loadUsers({ page: this.adminUserStore.filters().page });
  }

  protected applyFilters(filters: Partial<AdminUserListFilters>): void {
    this.adminUserStore.loadUsers(filters);
  }

  protected resetFilters(): void {
    this.adminUserStore.resetFilters();
  }

  protected changePage(page: number): void {
    this.adminUserStore.loadUsers({ page });
  }

  protected changePageSize(limit: number): void {
    this.adminUserStore.loadUsers({ page: 1, limit });
  }
}
