import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  LucideCircleAlert,
  LucideCreditCard,
  LucideReceiptText,
  LucideXCircle,
} from '@lucide/angular';

import { CurrentSubscriptionDto } from '../../models/subscription.models';
import { formatBillingDate } from '../../utils/subscription-formatters';

@Component({
  selector: 'app-billing-actions-card',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    LucideCircleAlert,
    LucideCreditCard,
    LucideReceiptText,
    LucideXCircle,
  ],
  templateUrl: './billing-actions-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingActionsCardComponent {
  readonly subscription = input<CurrentSubscriptionDto | null>(null);
  readonly canManage = input(false);
  readonly canCancel = input(false);
  readonly isCancelling = input(false);
  readonly errorMessages = input<readonly string[]>([]);
  readonly successMessage = input('');

  readonly cancelRequested = output<void>();

  protected readonly cancellationConfirmed = signal(false);
  protected readonly formatBillingDate = formatBillingDate;

  protected cancelSubscription(): void {
    if (!this.canManage() || !this.canCancel() || !this.cancellationConfirmed()) {
      return;
    }

    this.cancelRequested.emit();
  }
}
