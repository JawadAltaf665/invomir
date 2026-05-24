import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { LucideHistory, LucideRotateCcw } from '@lucide/angular';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { AuditLogListItemView } from '../../models/audit-log.models';
import { AuditActionBadgeComponent } from '../audit-action-badge/audit-action-badge.component';

@Component({
  selector: 'app-audit-log-table',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    PaginationComponent,
    AuditActionBadgeComponent,
    LucideHistory,
    LucideRotateCcw,
  ],
  templateUrl: './audit-log-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogTableComponent {
  readonly rows = input<readonly AuditLogListItemView[]>([]);
  readonly isLoading = input(false);
  readonly currentPage = input(1);
  readonly pageSize = input(20);
  readonly totalCount = input(0);
  readonly totalPages = input(0);
  readonly isSystemScope = input(false);
  readonly hasActiveFilters = input(false);

  readonly pageRequested = output<number>();
  readonly pageSizeRequested = output<number>();
  readonly resetRequested = output<void>();

  protected readonly skeletonRows = [1, 2, 3, 4, 5];
}
