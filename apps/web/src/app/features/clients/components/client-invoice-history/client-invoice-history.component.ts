import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideFileText } from '@lucide/angular';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ClientInvoiceSummaryView } from '../../models/client.models';

@Component({
  selector: 'app-client-invoice-history',
  standalone: true,
  imports: [NgClass, RouterLink, PaginationComponent, LucideFileText],
  templateUrl: './client-invoice-history.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientInvoiceHistoryComponent {
  readonly rows = input.required<readonly ClientInvoiceSummaryView[]>();
  readonly isLoading = input(false);
  readonly currentPage = input(1);
  readonly pageSize = input(20);
  readonly totalPages = input(0);
  readonly totalCount = input(0);

  readonly pageRequested = output<number>();
  readonly pageSizeRequested = output<number>();
}
