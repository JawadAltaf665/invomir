import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { LucideEdit3, LucideFilePlus2, LucideEye } from '@lucide/angular';

import { permissions } from '../../../../core/permissions/permissions';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { InvoiceListItemView } from '../../models/invoice.models';
import { InvoiceStatusBadgeComponent } from '../invoice-status-badge/invoice-status-badge.component';

@Component({
  selector: 'app-invoice-table',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [
    MatButtonModule,
    RouterLink,
    HasPermissionDirective,
    InvoiceStatusBadgeComponent,
    PaginationComponent,
    LucideEdit3,
    LucideFilePlus2,
    LucideEye,
  ],
  templateUrl: './invoice-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceTableComponent {
  readonly rows = input.required<readonly InvoiceListItemView[]>();
  readonly isLoading = input(false);
  readonly currentPage = input(1);
  readonly pageSize = input(20);
  readonly totalPages = input(0);
  readonly totalCount = input(0);
  readonly canCreate = input(false);

  readonly pageRequested = output<number>();
  readonly pageSizeRequested = output<number>();
  readonly createRequested = output<void>();

  protected readonly permissions = permissions;
  protected readonly skeletonRows = [1, 2, 3, 4, 5] as const;
}
