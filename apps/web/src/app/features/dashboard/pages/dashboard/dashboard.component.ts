import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { permissions } from '../../../../core/permissions/permissions';
import { WorkspaceCurrencyRefreshService } from '../../../../core/services/workspace-currency-refresh.service';
import { InvoiceAnalyticsComponent } from '../../components/invoice-analytics/invoice-analytics.component';
import { MonthlyChartComponent } from '../../components/monthly-chart/monthly-chart.component';
import { OverdueInvoicesComponent } from '../../components/overdue-invoices/overdue-invoices.component';
import { PaymentSummaryComponent } from '../../components/payment-summary/payment-summary.component';
import { RecentInvoicesComponent } from '../../components/recent-invoices/recent-invoices.component';
import { RevenueCardComponent } from '../../components/revenue-card/revenue-card.component';
import { SubscriptionStatusComponent } from '../../components/subscription-status/subscription-status.component';
import { DashboardAccountSummary } from '../../models/dashboard.models';
import { DashboardStore } from '../../store/dashboard.store';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    TranslatePipe,
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
  private readonly translation = inject(TranslationService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);
  private observedSessionKey = this.dashboardSessionKey();
  private readonly reloadOnAuthenticatedUserChange = effect(() => {
    const sessionKey = this.dashboardSessionKey();

    if (sessionKey === this.observedSessionKey) {
      return;
    }

    this.observedSessionKey = sessionKey;

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!sessionKey) {
      this.dashboardStore.clear();
      return;
    }

    this.dashboardStore.load(true);
  });
  private observedCurrencyRefreshVersion = this.workspaceCurrencyRefresh.version();
  private readonly refreshOnWorkspaceCurrencyChange = effect(() => {
    const version = this.workspaceCurrencyRefresh.version();

    if (version === this.observedCurrencyRefreshVersion) {
      return;
    }

    this.observedCurrencyRefreshVersion = version;

    if (isPlatformBrowser(this.platformId)) {
      this.dashboardStore.refresh();
    }
  });

  protected readonly skeletonCards = [1, 2, 3, 4] as const;
  protected readonly skeletonRows = [1, 2, 3, 4, 5] as const;
  protected readonly greeting = computed(() => {
    const firstName = this.authSession.user()?.firstName;
    return firstName
      ? this.translation.translate('dashboard.greetingName', { name: firstName })
      : this.translation.translate('dashboard.greeting');
  });
  protected readonly lastUpdatedLabel = computed(() => {
    const lastLoadedAt = this.dashboardStore.lastLoadedAt();

    if (!lastLoadedAt) {
      return this.translation.translate('dashboard.notLoaded');
    }

    const ageSeconds = Math.max(0, Math.floor((Date.now() - lastLoadedAt.getTime()) / 1000));

    if (ageSeconds < 60) {
      return this.translation.translate('dashboard.lastUpdatedNow');
    }

    const ageMinutes = Math.floor(ageSeconds / 60);
    if (ageMinutes < 60) {
      return this.translation.translate('dashboard.lastUpdatedMinutes', { minutes: ageMinutes });
    }

    const date = new Intl.DateTimeFormat(this.translation.language(), {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(lastLoadedAt);

    return this.translation.translate('dashboard.lastUpdatedAt', { date });
  });

  protected readonly accountSummary = computed<DashboardAccountSummary>(() => {
    const user = this.authSession.user();
    const dashboard = this.dashboardStore.dashboard();

    return {
      name: user?.firstName ?? 'InvoMir',
      email: user?.email ?? this.translation.translate('layout.workspace'),
      role: this.toWorkspaceRoleLabel(dashboard?.workspaceRole ?? user?.role ?? 'member'),
      plan: this.toTitleCase(user?.plan ?? 'free'),
      trialLabel: this.formatTrialLabel(user?.trialEndsAt ?? null),
      accessBadges: [
        {
          id: 'invoices',
          label: this.translation.translate('navigation.invoices'),
          permission: permissions.invoice.view,
        },
        {
          id: 'clients',
          label: this.translation.translate('navigation.clients'),
          permission: permissions.client.view,
        },
        {
          id: 'payments',
          label: this.translation.translate('navigation.payments'),
          permission: permissions.payment.view,
        },
        {
          id: 'reports',
          label: this.translation.translate('navigation.reports'),
          permission: permissions.report.view,
        },
        {
          id: 'billing',
          label: this.translation.translate('dashboard.billing'),
          permission: permissions.subscription.manage,
        },
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
      return this.translation.translate('dashboard.trialActive');
    }

    const date = new Date(trialEndsAt);

    if (Number.isNaN(date.getTime())) {
      return this.translation.translate('dashboard.trialActive');
    }

    const label = new Intl.DateTimeFormat(this.translation.language(), {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

    return date.getTime() >= Date.now()
      ? this.translation.translate('dashboard.trialEnds', { date: label })
      : this.translation.translate('dashboard.trialEnded', { date: label });
  }

  private toTitleCase(value: string): string {
    return value
      .replace(/[-_]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
      .join(' ');
  }

  private toWorkspaceRoleLabel(value: string): string {
    const workspaceRole = value === 'system_admin' ? 'owner' : value;
    const key = `roles.${workspaceRole}`;
    const translated = this.translation.translate(key);
    return translated === key ? this.toTitleCase(workspaceRole) : translated;
  }

  private dashboardSessionKey(): string | null {
    const user = this.authSession.user();
    return user?.id && user.tenantId ? `${user.tenantId}:${user.id}` : null;
  }
}
