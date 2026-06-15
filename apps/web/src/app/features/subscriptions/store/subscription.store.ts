import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, map, tap, throwError } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  CurrentSubscriptionDto,
  SubscriptionCancellationDto,
  SubscriptionCheckoutDto,
  SubscriptionCheckoutRequest,
  SubscriptionInterval,
  SubscriptionPlanCardView,
  SubscriptionPlanDto,
  SubscriptionPortalDto,
  SubscriptionUsageMetricView,
} from '../models/subscription.models';
import { SubscriptionApiService } from '../services/subscription-api.service';
import { buildPlanCardView, buildUsageMetricView } from '../utils/subscription-formatters';

@Injectable({ providedIn: 'root' })
export class SubscriptionStore {
  private readonly subscriptionApi = inject(SubscriptionApiService);

  private readonly currentSubscriptionSignal = signal<CurrentSubscriptionDto | null>(null);
  private readonly plansSignal = signal<readonly SubscriptionPlanDto[]>([]);
  private readonly intervalSignal = signal<SubscriptionInterval>('month');
  private readonly isLoadingSignal = signal(false);
  private readonly loadErrorMessagesSignal = signal<readonly string[]>([]);

  private readonly isStartingCheckoutSignal = signal(false);
  private readonly checkoutErrorMessagesSignal = signal<readonly string[]>([]);

  private readonly isCancellingSignal = signal(false);
  private readonly cancellationErrorMessagesSignal = signal<readonly string[]>([]);
  private readonly cancellationSuccessMessageSignal = signal('');
  private readonly isOpeningPortalSignal = signal(false);
  private readonly portalErrorMessagesSignal = signal<readonly string[]>([]);

  readonly currentSubscription = this.currentSubscriptionSignal.asReadonly();
  readonly plans = this.plansSignal.asReadonly();
  readonly interval = this.intervalSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly loadErrorMessages = this.loadErrorMessagesSignal.asReadonly();

  readonly isStartingCheckout = this.isStartingCheckoutSignal.asReadonly();
  readonly checkoutErrorMessages = this.checkoutErrorMessagesSignal.asReadonly();

  readonly isCancelling = this.isCancellingSignal.asReadonly();
  readonly cancellationErrorMessages = this.cancellationErrorMessagesSignal.asReadonly();
  readonly cancellationSuccessMessage = this.cancellationSuccessMessageSignal.asReadonly();
  readonly isOpeningPortal = this.isOpeningPortalSignal.asReadonly();
  readonly portalErrorMessages = this.portalErrorMessagesSignal.asReadonly();

  readonly isBusy = computed(
    () => this.isLoading() || this.isStartingCheckout() || this.isCancelling() || this.isOpeningPortal(),
  );

  readonly usageMetrics = computed<readonly SubscriptionUsageMetricView[]>(() => {
    const subscription = this.currentSubscription();

    if (!subscription) {
      return [];
    }

    return [
      buildUsageMetricView('clients', 'Clients', subscription.usage.clients),
      buildUsageMetricView(
        'invoices-this-month',
        'Invoices this month',
        subscription.usage.invoicesThisMonth,
      ),
    ];
  });

  readonly planCards = computed<readonly SubscriptionPlanCardView[]>(() =>
    this.plans().map((plan) => buildPlanCardView(plan, this.currentSubscription())),
  );

  readonly canCancelCurrentPlan = computed(() => {
    const subscription = this.currentSubscription();

    return Boolean(
      subscription?.stripeSubscriptionId &&
      subscription.status !== 'cancelled' &&
      !subscription.cancelAtPeriodEnd,
    );
  });

  loadBilling(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoadingSignal.set(true);
    this.loadErrorMessagesSignal.set([]);

    forkJoin({
      currentSubscription: this.subscriptionApi
        .getCurrentSubscription()
        .pipe(map((response) => this.unwrap(response, 'Subscription could not be loaded.'))),
      plans: this.subscriptionApi
        .getPlans()
        .pipe(map((response) => this.unwrap(response, 'Subscription plans could not be loaded.'))),
    })
      .pipe(finalize(() => this.isLoadingSignal.set(false)))
      .subscribe({
        next: ({ currentSubscription, plans }) => {
          this.currentSubscriptionSignal.set(currentSubscription);
          this.plansSignal.set(plans.plans);
        },
        error: (error) => this.loadErrorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  setInterval(interval: SubscriptionInterval): void {
    this.intervalSignal.set(interval);
  }

  startCheckout(request: SubscriptionCheckoutRequest): Observable<SubscriptionCheckoutDto> {
    this.isStartingCheckoutSignal.set(true);
    this.checkoutErrorMessagesSignal.set([]);

    return this.subscriptionApi.createCheckout(request).pipe(
      map((response) => this.unwrap(response, 'Subscription checkout could not be started.')),
      catchError((error) => {
        this.checkoutErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.isStartingCheckoutSignal.set(false)),
    );
  }

  cancelSubscription(): Observable<SubscriptionCancellationDto> {
    this.isCancellingSignal.set(true);
    this.cancellationErrorMessagesSignal.set([]);
    this.cancellationSuccessMessageSignal.set('');

    return this.subscriptionApi.cancelSubscription().pipe(
      map((response) => this.unwrap(response, 'Subscription could not be cancelled.')),
      tap((cancellation) => {
        this.currentSubscriptionSignal.update((subscription) =>
          subscription
            ? {
                ...subscription,
                status: cancellation.status,
                cancelAtPeriodEnd: cancellation.cancelAtPeriodEnd,
                currentPeriodEnd: cancellation.currentPeriodEnd,
                cancelledAt: cancellation.cancelledAt,
              }
            : subscription,
        );
        this.cancellationSuccessMessageSignal.set('Subscription cancellation scheduled.');
      }),
      catchError((error) => {
        this.cancellationErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.isCancellingSignal.set(false)),
    );
  }

  openBillingPortal(): Observable<SubscriptionPortalDto> {
    this.isOpeningPortalSignal.set(true);
    this.portalErrorMessagesSignal.set([]);

    return this.subscriptionApi.createPortalSession().pipe(
      map((response) => this.unwrap(response, 'Billing portal could not be opened.')),
      catchError((error) => {
        this.portalErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.isOpeningPortalSignal.set(false)),
    );
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
