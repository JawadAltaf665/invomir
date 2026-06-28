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
import { ConfirmationDialogService } from '../../../../core/services/confirmation-dialog.service';
import { PaymentFiltersComponent } from '../../components/payment-filters/payment-filters.component';
import { PaymentTableComponent } from '../../components/payment-table/payment-table.component';
import { StripeConnectCardComponent } from '../../components/stripe-connect-card/stripe-connect-card.component';
import { PaymentListFilters, StripeConnectStatusDto } from '../../models/payment.models';
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
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly stripeStatus = signal<StripeConnectStatusDto | null>(null);
  protected readonly isLoadingStripeStatus = signal(false);
  protected readonly isConnectingStripe = signal(false);
  protected readonly isDisconnectingStripe = signal(false);
  protected readonly stripeErrorMessages = signal<readonly string[]>([]);

  protected readonly canManagePayments = computed(() =>
    this.authSession.hasPermission(permissions.payment.manage),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.paymentStore.loadPayments();
    this.loadStripeStatus();
  }

  protected refresh(): void {
    this.paymentStore.loadPayments({ page: this.paymentStore.filters().page });
    this.loadStripeStatus();
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
    if (!this.canManagePayments() || this.isConnectingStripe() || this.stripeStatus()?.isConnected) {
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
          const oauthUrl = result.oauthUrl?.trim();
          if (!oauthUrl) {
            this.stripeErrorMessages.set(['Stripe Connect URL was missing from the server response.']);
            return;
          }

          if (isPlatformBrowser(this.platformId)) {
            window.location.assign(oauthUrl);
          }
        },
        error: (error) => {
          const messages = extractApiErrors(error).filter(
            (message) => !message.toLowerCase().includes('already connected'),
          );

          if (messages.length > 0) {
            this.stripeErrorMessages.set(messages);
          }
        },
      });
  }

  protected disconnectStripe(): void {
    if (!this.canManagePayments() || this.isDisconnectingStripe() || !this.stripeStatus()?.isConnected) {
      return;
    }

    this.confirmationDialog
      .confirmAction(
        {
          title: 'Disconnect Stripe',
          message: 'Are you sure? This will disable card payments on your invoices.',
          cancelLabel: 'Cancel',
          confirmLabel: 'Disconnect',
          processingLabel: 'Disconnecting',
          tone: 'danger',
        },
        () => {
          this.isDisconnectingStripe.set(true);
          return this.paymentApi.disconnectStripe().pipe(
            map((response) => this.unwrap(response, 'Stripe could not be disconnected.')),
            finalize(() => this.isDisconnectingStripe.set(false)),
          );
        },
      )
      .subscribe({
        next: () => this.loadStripeStatus(),
        error: () => undefined,
      });
  }

  private loadStripeStatus(): void {
    this.isLoadingStripeStatus.set(true);

    this.paymentApi
      .getStripeStatus()
      .pipe(
        map((response) => this.unwrap(response, 'Stripe status could not be loaded.')),
        finalize(() => this.isLoadingStripeStatus.set(false)),
      )
      .subscribe({
        next: (status) => {
          this.stripeStatus.set(status);
          this.stripeErrorMessages.set([]);
        },
        error: () => this.stripeStatus.set({ isConnected: false, accountId: null, connectedAt: null }),
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
