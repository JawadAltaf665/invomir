import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { permissions } from '../../../../core/permissions/permissions';
import { InvoiceAnalyticsComponent } from '../../components/invoice-analytics/invoice-analytics.component';
import { MonthlyChartComponent } from '../../components/monthly-chart/monthly-chart.component';
import { OverdueInvoicesComponent } from '../../components/overdue-invoices/overdue-invoices.component';
import { PaymentSummaryComponent } from '../../components/payment-summary/payment-summary.component';
import { RecentInvoicesComponent } from '../../components/recent-invoices/recent-invoices.component';
import { RevenueCardComponent } from '../../components/revenue-card/revenue-card.component';
import { SubscriptionStatusComponent } from '../../components/subscription-status/subscription-status.component';
import { DashboardAccountSummary } from '../../models/dashboard.models';
import { DashboardStore } from '../../store/dashboard.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatButtonModule,
    InvoiceAnalyticsComponent,
    MonthlyChartComponent,
    OverdueInvoicesComponent,
    PaymentSummaryComponent,
    RecentInvoicesComponent,
    RevenueCardComponent,
    SubscriptionStatusComponent,
  ],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  protected readonly dashboardStore = inject(DashboardStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly skeletonCards = [1, 2, 3, 4] as const;
  protected readonly skeletonRows = [1, 2, 3, 4, 5] as const;
  protected readonly greeting = computed(() => {
    const firstName = this.authSession.user()?.firstName;
    return firstName ? `Good to see you, ${firstName}.` : 'Good to see you.';
  });

  protected readonly accountSummary = computed<DashboardAccountSummary>(() => {
    const user = this.authSession.user();

    return {
      name: user?.firstName ?? 'InvoMir user',
      email: user?.email ?? 'Workspace account',
      role: this.toTitleCase(user?.role ?? 'member'),
      plan: this.toTitleCase(user?.plan ?? 'free'),
      trialLabel: this.formatTrialLabel(user?.trialEndsAt ?? null),
      accessBadges: [
        { id: 'invoices', label: 'Invoices', permission: permissions.invoice.view },
        { id: 'clients', label: 'Clients', permission: permissions.client.view },
        { id: 'payments', label: 'Payments', permission: permissions.payment.view },
        { id: 'reports', label: 'Reports', permission: permissions.report.view },
        { id: 'billing', label: 'Billing', permission: permissions.subscription.view },
      ]
        .filter((item) => this.authSession.hasPermission(item.permission))
        .map(({ id, label }) => ({ id, label })),
    };
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.dashboardStore.load();
    }
  }

  protected refreshDashboard(): void {
    this.dashboardStore.refresh();
  }

  private formatTrialLabel(trialEndsAt: string | null): string {
    if (!trialEndsAt) {
      return 'Active';
    }

    const date = new Date(trialEndsAt);

    if (Number.isNaN(date.getTime())) {
      return 'Active';
    }

    const label = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

    return date.getTime() >= Date.now() ? `Ends ${label}` : `Ended ${label}`;
  }

  private toTitleCase(value: string): string {
    return value
      .replace(/[-_]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
      .join(' ');
  }
}
