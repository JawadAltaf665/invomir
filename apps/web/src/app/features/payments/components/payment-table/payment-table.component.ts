import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideCreditCard, LucideReceiptText } from '@lucide/angular';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { PaymentListItemView } from '../../models/payment.models';
import { PaymentStatusBadgeComponent } from '../payment-status-badge/payment-status-badge.component';

@Component({
  selector: 'app-payment-table',
  standalone: true,
  imports: [
    RouterLink,
    PaginationComponent,
    PaymentStatusBadgeComponent,
    LucideCreditCard,
    LucideReceiptText,
  ],
  templateUrl: './payment-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentTableComponent {
  readonly rows = input<readonly PaymentListItemView[]>([]);
  readonly isLoading = input(false);
  readonly currentPage = input(1);
  readonly pageSize = input(20);
  readonly totalCount = input(0);
  readonly totalPages = input(0);

  readonly pageRequested = output<number>();
  readonly pageSizeRequested = output<number>();

  protected readonly skeletonRows = [1, 2, 3, 4, 5];
}
