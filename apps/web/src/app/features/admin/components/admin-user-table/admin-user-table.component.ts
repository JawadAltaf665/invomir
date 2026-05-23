import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import {
  LucideChevronDown,
  LucideChevronUp,
  LucideEye,
  LucideSlidersHorizontal,
  LucideUsers,
} from '@lucide/angular';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { AdminUserListItemView } from '../../models/admin-user.models';
import { AdminUserBadgeComponent } from '../admin-user-badge/admin-user-badge.component';

@Component({
  selector: 'app-admin-user-table',
  standalone: true,
  imports: [
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    PaginationComponent,
    AdminUserBadgeComponent,
    LucideChevronDown,
    LucideChevronUp,
    LucideEye,
    LucideSlidersHorizontal,
    LucideUsers,
  ],
  templateUrl: './admin-user-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserTableComponent {
  readonly rows = input.required<readonly AdminUserListItemView[]>();
  readonly isLoading = input(false);
  readonly currentPage = input(1);
  readonly pageSize = input(20);
  readonly totalPages = input(0);
  readonly totalCount = input(0);
  readonly canManage = input(false);

  readonly pageRequested = output<number>();
  readonly pageSizeRequested = output<number>();

  protected readonly skeletonRows = [1, 2, 3, 4, 5] as const;
  protected readonly openActionUserId = signal<string | null>(null);
}
