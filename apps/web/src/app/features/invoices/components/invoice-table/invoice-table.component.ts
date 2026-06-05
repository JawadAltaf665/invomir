import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import {
  LucideBan,
  LucideBanknote,
  LucideChevronDown,
  LucideChevronUp,
  LucideDownload,
  LucideEdit3,
  LucideEye,
  LucideFilePlus2,
  LucideSend,
} from '@lucide/angular';

import { permissions } from '../../../../core/permissions/permissions';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import {
  InvoiceListFilters,
  InvoiceListItemView,
  InvoiceTableActionEvent,
} from '../../models/invoice.models';
import { InvoiceStatusBadgeComponent } from '../invoice-status-badge/invoice-status-badge.component';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-invoice-table',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [
    TranslatePipe,
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    HasPermissionDirective,
    InvoiceStatusBadgeComponent,
    PaginationComponent,
    LucideBan,
    LucideBanknote,
    LucideChevronDown,
    LucideChevronUp,
    LucideDownload,
    LucideEdit3,
    LucideFilePlus2,
    LucideEye,
    LucideSend,
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
  readonly hasActiveFilters = input(false);
  readonly sortBy = input<InvoiceListFilters['sortBy']>('created');
  readonly sortDirection = input<InvoiceListFilters['sortDirection']>('desc');
  readonly isActionRunning = input(false);

  readonly pageRequested = output<number>();
  readonly pageSizeRequested = output<number>();
  readonly sortRequested = output<InvoiceListFilters['sortBy']>();
  readonly resetRequested = output<void>();
  readonly createRequested = output<void>();
  readonly invoiceActionRequested = output<InvoiceTableActionEvent>();

  protected readonly permissions = permissions;
  protected readonly skeletonRows = [1, 2, 3, 4, 5] as const;

  protected canSend(invoice: InvoiceListItemView): boolean {
    return invoice.status === 'draft';
  }

  protected canResend(invoice: InvoiceListItemView): boolean {
    return ['sent', 'viewed', 'overdue'].includes(invoice.status);
  }

  protected canMarkPaid(invoice: InvoiceListItemView): boolean {
    return !['paid', 'cancelled'].includes(invoice.status);
  }

  protected canCancel(invoice: InvoiceListItemView): boolean {
    return ['sent', 'viewed', 'overdue'].includes(invoice.status);
  }

  protected requestSort(sortBy: InvoiceListFilters['sortBy']): void {
    this.sortRequested.emit(sortBy);
  }

  protected requestAction(event: InvoiceTableActionEvent): void {
    this.invoiceActionRequested.emit(event);
  }
}
