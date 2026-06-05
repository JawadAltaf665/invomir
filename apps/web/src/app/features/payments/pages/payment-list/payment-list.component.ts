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
import { LucideRefreshCcw } from '@lucide/angular';
import { finalize, map } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { ApiResponseError, extractApiErrors } from '../../../../core/errors/api-response-error';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { permissions } from '../../../../core/permissions/permissions';
import { PaymentFiltersComponent } from '../../components/payment-filters/payment-filters.component';
import { PaymentTableComponent } from '../../components/payment-table/payment-table.component';
import { StripeConnectCardComponent } from '../../components/stripe-connect-card/stripe-connect-card.component';
import { PaymentListFilters } from '../../models/payment.models';
import { PaymentApiService } from '../../services/payment-api.service';
import { PaymentListStore } from '../../store/payment-list.store';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    TranslatePipe,
    MatButtonModule,
    PaymentFiltersComponent,
    PaymentTableComponent,
    StripeConnectCardComponent,
    LucideRefreshCcw,
  ],
  templateUrl: './payment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentListComponent implements OnInit {
  protected readonly paymentStore = inject(PaymentListStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly paymentApi = inject(PaymentApiService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly isConnectingStripe = signal(false);
  protected readonly stripeErrorMessages = signal<readonly string[]>([]);

  protected readonly canManagePayments = computed(() =>
    this.authSession.hasPermission(permissions.payment.manage),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.paymentStore.loadPayments();
  }

  protected refresh(): void {
    this.paymentStore.loadPayments({ page: this.paymentStore.filters().page });
  }

  protected applyFilters(filters: Partial<PaymentListFilters>): void {
    if (
      filters.searchTerm !== undefined &&
      filters.status === undefined &&
      filters.page === undefined
    ) {
      this.paymentStore.setSearchTerm(filters.searchTerm);
      return;
    }

    this.paymentStore.loadPayments(filters);
  }

  protected resetFilters(): void {
    this.paymentStore.resetFilters();
  }

  protected changePage(page: number): void {
    this.paymentStore.loadPayments({ page });
  }

  protected changePageSize(limit: number): void {
    this.paymentStore.loadPayments({ page: 1, limit });
  }

  protected connectStripe(): void {
    if (!this.canManagePayments() || this.isConnectingStripe()) {
      return;
    }

    this.isConnectingStripe.set(true);
    this.stripeErrorMessages.set([]);

    this.paymentApi
      .createStripeConnect()
      .pipe(
        map((response) => this.unwrap(response, 'Stripe Connect could not be started.')),
        finalize(() => this.isConnectingStripe.set(false)),
      )
      .subscribe({
        next: (result) => {
          if (isPlatformBrowser(this.platformId)) {
            window.location.assign(result.oauthUrl);
          }
        },
        error: (error) => this.stripeErrorMessages.set(extractApiErrors(error)),
      });
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
