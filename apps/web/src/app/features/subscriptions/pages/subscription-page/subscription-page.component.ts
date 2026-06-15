import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { LucideRefreshCcw } from '@lucide/angular';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { permissions } from '../../../../core/permissions/permissions';
import { ConfirmationDialogService } from '../../../../core/services/confirmation-dialog.service';
import { WorkspaceCurrencyRefreshService } from '../../../../core/services/workspace-currency-refresh.service';
import { BillingActionsCardComponent } from '../../components/billing-actions-card/billing-actions-card.component';
import { CurrentPlanCardComponent } from '../../components/current-plan-card/current-plan-card.component';
import { PlanCardComponent } from '../../components/plan-card/plan-card.component';
import { UsageMetricsCardComponent } from '../../components/usage-metrics-card/usage-metrics-card.component';
import { SubscriptionInterval } from '../../models/subscription.models';
import { SubscriptionStore } from '../../store/subscription.store';
import { formatBillingDate, formatTrialDaysRemaining } from '../../utils/subscription-formatters';

@Component({
  selector: 'app-subscription-page',
  standalone: true,
  imports: [
    MatButtonModule,
    BillingActionsCardComponent,
    CurrentPlanCardComponent,
    PlanCardComponent,
    UsageMetricsCardComponent,
    LucideRefreshCcw,
  ],
  templateUrl: './subscription-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionPageComponent implements OnInit {
  protected readonly subscriptionStore = inject(SubscriptionStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly confirmationDialog = inject(ConfirmationDialogService);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);
  private observedCurrencyRefreshVersion = this.workspaceCurrencyRefresh.version();
  private readonly refreshOnWorkspaceCurrencyChange = effect(() => {
    const version = this.workspaceCurrencyRefresh.version();

    if (version === this.observedCurrencyRefreshVersion) {
      return;
    }

    this.observedCurrencyRefreshVersion = version;

    if (isPlatformBrowser(this.platformId)) {
      this.subscriptionStore.loadBilling();
    }
  });

  protected readonly activeCheckoutPlan = signal<string | null>(null);
  protected readonly checkoutReturnMessage = signal('');
  protected readonly intervalOptions: readonly SubscriptionInterval[] = ['month', 'year'];

  protected readonly canManageSubscriptions = computed(() =>
    this.authSession.hasPermission(permissions.subscription.manage),
  );
  protected readonly trialBanner = computed(() => {
    const subscription = this.subscriptionStore.currentSubscription();

    if (
      !subscription ||
      subscription.status !== 'trialing' ||
      !subscription.trialEndsAt ||
      subscription.trialDaysRemaining === null
    ) {
      return null;
    }

    return {
      endDate: formatBillingDate(subscription.trialEndsAt),
      remaining: formatTrialDaysRemaining(subscription.trialDaysRemaining),
    };
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (sessionId) {
      this.checkoutReturnMessage.set(
        'Checkout completed. Subscription status will update after confirmation.',
      );
    }

    this.subscriptionStore.loadBilling();
  }

  protected refresh(): void {
    this.subscriptionStore.loadBilling();
  }

  protected setInterval(interval: SubscriptionInterval): void {
    this.subscriptionStore.setInterval(interval);
  }

  protected scrollToPlans(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.getElementById('plans')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  protected startCheckout(plan: string): void {
    if (!this.canManageSubscriptions() || this.subscriptionStore.isStartingCheckout()) {
      return;
    }

    const selectedPlan = this.subscriptionStore
      .plans()
      .find((availablePlan) => availablePlan.plan === plan);
    const interval = this.subscriptionStore.interval();

    this.activeCheckoutPlan.set(plan);

    this.confirmationDialog
      .confirmAction(
        {
          title: 'Confirm Action',
          message: `Continue to Stripe Checkout for ${selectedPlan?.name ?? plan} (${interval === 'year' ? 'yearly' : 'monthly'})?`,
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm',
          processingLabel: 'Opening checkout',
        },
        () =>
          this.subscriptionStore.startCheckout({
            plan,
            interval,
          }),
      )
      .subscribe({
        next: (checkout) => {
          if (isPlatformBrowser(this.platformId)) {
            window.location.assign(checkout.checkoutUrl);
          }
        },
        error: () => this.activeCheckoutPlan.set(null),
        complete: () => this.activeCheckoutPlan.set(null),
      });
  }

  protected cancelSubscription(): void {
    if (!this.canManageSubscriptions() || this.subscriptionStore.isCancelling()) {
      return;
    }

    this.subscriptionStore.cancelSubscription().subscribe({
      error: () => undefined,
    });
  }

  protected openBillingPortal(): void {
    if (!this.canManageSubscriptions() || this.subscriptionStore.isOpeningPortal()) {
      return;
    }

    this.subscriptionStore.openBillingPortal().subscribe({
      next: (portal) => {
        if (isPlatformBrowser(this.platformId)) {
          window.location.assign(portal.portalUrl);
        }
      },
      error: () => undefined,
    });
  }
}
