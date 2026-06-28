import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideArrowUpRight, LucideCircleCheck, LucideLock } from '@lucide/angular';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { StripeConnectStatusDto } from '../../models/payment.models';
import { formatStripeConnectedDate } from '../../utils/payment-formatters';

@Component({
  selector: 'app-stripe-connect-card',
  standalone: true,
  imports: [
    TranslatePipe,
    MatButtonModule,
    MatProgressSpinnerModule,
    LucideArrowUpRight,
    LucideCircleCheck,
    LucideLock,
  ],
  templateUrl: './stripe-connect-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StripeConnectCardComponent {
  readonly canManage = input(false);
  readonly status = input<StripeConnectStatusDto | null>(null);
  readonly isLoadingStatus = input(false);
  readonly isConnecting = input(false);
  readonly isDisconnecting = input(false);
  readonly errorMessages = input<readonly string[]>([]);

  readonly connectRequested = output<void>();
  readonly disconnectRequested = output<void>();

  protected readonly isConnected = computed(() => this.status()?.isConnected === true);
  protected readonly connectedAtLabel = computed(() =>
    formatStripeConnectedDate(this.status()?.connectedAt ?? null),
  );
  protected readonly accountSummary = computed(() => {
    const status = this.status();
    if (!status?.accountId) {
      return '';
    }

    const connectedLabel = this.connectedAtLabel();
    return connectedLabel
      ? `${status.accountId} · Connected ${connectedLabel}`
      : status.accountId;
  });
}
