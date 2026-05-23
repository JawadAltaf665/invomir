import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LucideArrowUpRight, LucideShieldCheck } from '@lucide/angular';

@Component({
  selector: 'app-stripe-connect-card',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule, LucideArrowUpRight, LucideShieldCheck],
  templateUrl: './stripe-connect-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StripeConnectCardComponent {
  readonly canManage = input(false);
  readonly isConnecting = input(false);
  readonly errorMessages = input<readonly string[]>([]);

  readonly connectRequested = output<void>();
}
