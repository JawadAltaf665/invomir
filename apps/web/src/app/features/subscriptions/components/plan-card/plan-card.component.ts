import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LucideCheck, LucideCircleHelp, LucideX } from '@lucide/angular';

import { SubscriptionInterval, SubscriptionPlanCardView } from '../../models/subscription.models';
import { checkoutButtonLabel } from '../../utils/subscription-formatters';

@Component({
  selector: 'app-plan-card',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [
    NgClass,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    LucideCheck,
    LucideCircleHelp,
    LucideX,
  ],
  templateUrl: './plan-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanCardComponent {
  readonly card = input.required<SubscriptionPlanCardView>();
  readonly interval = input<SubscriptionInterval>('month');
  readonly canManage = input(false);
  readonly isStartingCheckout = input(false);
  readonly activeCheckoutPlan = input<string | null>(null);

  readonly checkoutRequested = output<string>();

  protected readonly checkoutButtonLabel = checkoutButtonLabel;

  protected isCheckoutAvailable(): boolean {
    const card = this.card();

    if (!card.isPaid) {
      return false;
    }

    return this.interval() === 'year'
      ? card.plan.yearlyCheckoutAvailable
      : card.plan.monthlyCheckoutAvailable;
  }

  protected isCheckoutDisabled(): boolean {
    const card = this.card();

    return (
      !this.canManage() ||
      card.isCurrent ||
      !card.isPaid ||
      !this.isCheckoutAvailable() ||
      this.isStartingCheckout()
    );
  }

  protected checkoutTooltip(): string {
    const card = this.card();

    if (card.isCurrent) {
      return 'This is your current plan.';
    }

    if (!card.isPaid) {
      return 'Free plan checkout is not required.';
    }

    if (!this.canManage()) {
      return 'You do not have permission to manage subscriptions.';
    }

    if (!this.isCheckoutAvailable()) {
      return 'Checkout is currently unavailable.';
    }

    if (this.isStartingCheckout()) {
      return 'Preparing checkout.';
    }

    return '';
  }

  protected startCheckout(): void {
    const card = this.card();

    if (this.isCheckoutDisabled()) {
      return;
    }

    this.checkoutRequested.emit(card.plan.plan);
  }
}
