import { NgClass, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideBell,
  LucideBadgeDollarSign,
  LucideChartNoAxesCombined,
  LucideChevronDown,
  LucideCreditCard,
  LucideFileText,
  LucideHistory,
  LucideLayoutDashboard,
  LucideLogOut,
  LucideMenu,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucideReceiptText,
  LucideSettings,
  LucideShieldCheck,
  LucideUsers,
} from '@lucide/angular';
import { finalize, map } from 'rxjs';

import { AuthSessionService } from '../../core/auth/auth-session.service';
import { SupportedCurrency, supportedCurrencies } from '../../core/auth/auth.models';
import { ApiResponseError, extractApiErrors } from '../../core/errors/api-response-error';
import { ApiResponse } from '../../core/models/api-response.model';
import { Permission, permissions } from '../../core/permissions/permissions';
import { CurrentUserApiService } from '../../core/services/current-user-api.service';
import { WorkspaceCurrencyRefreshService } from '../../core/services/workspace-currency-refresh.service';

type SidebarIcon =
  | 'dashboard'
  | 'invoices'
  | 'clients'
  | 'payments'
  | 'reports'
  | 'subscriptions'
  | 'team'
  | 'auditLogs'
  | 'settings'
  | 'admin';

interface SidebarNavItem {
  label: string;
  route: string;
  icon: SidebarIcon;
  permissions: readonly Permission[];
  disabled?: boolean;
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideBadgeDollarSign,
    LucideBell,
    LucideChartNoAxesCombined,
    LucideChevronDown,
    LucideCreditCard,
    LucideFileText,
    LucideHistory,
    LucideLayoutDashboard,
    LucideLogOut,
    LucideMenu,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucideReceiptText,
    LucideSettings,
    LucideShieldCheck,
    LucideUsers,
  ],
  templateUrl: './dashboard-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardLayoutComponent implements OnInit {
  protected readonly authSession = inject(AuthSessionService);
  protected readonly isLoggingOut = signal(false);
  protected readonly isSidebarExpanded = signal(true);
  protected readonly isMobileSidebarOpen = signal(false);
  protected readonly currentCurrency = signal<SupportedCurrency>('USD');
  protected readonly isCurrencyLoading = signal(false);
  protected readonly isCurrencySaving = signal(false);
  protected readonly currencyErrorMessages = signal<readonly string[]>([]);
  protected readonly currencyOptions = supportedCurrencies;
  private readonly router = inject(Router);
  private readonly currentUserApi = inject(CurrentUserApiService);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly currencyLabel = computed(() => this.currentCurrency());

  private readonly mainNavItems: readonly SidebarNavItem[] = [
    {
      label: 'Dashboard',
      route: '/app/dashboard',
      icon: 'dashboard',
      permissions: [permissions.dashboard.view],
    },
    {
      label: 'Invoices',
      route: '/app/invoices',
      icon: 'invoices',
      permissions: [permissions.invoice.view],
    },
    {
      label: 'Clients',
      route: '/app/clients',
      icon: 'clients',
      permissions: [permissions.client.view],
    },
    {
      label: 'Payments',
      route: '/app/payments',
      icon: 'payments',
      permissions: [permissions.payment.view],
    },
    {
      label: 'Reports',
      route: '/app/reports',
      icon: 'reports',
      permissions: [permissions.report.view],
    },
  ];

  private readonly manageNavItems: readonly SidebarNavItem[] = [
    {
      label: 'Subscriptions',
      route: '/app/subscriptions',
      icon: 'subscriptions',
      permissions: [permissions.subscription.view],
    },
    {
      label: 'Team',
      route: '/app/team',
      icon: 'team',
      permissions: [permissions.team.manage],
    },
    {
      label: 'Audit logs',
      route: '/app/audit-logs',
      icon: 'auditLogs',
      permissions: [permissions.auditLog.view],
    },
    {
      label: 'Settings',
      route: '/app/settings',
      icon: 'settings',
      permissions: [permissions.settings.manage],
    },
    {
      label: 'Admin',
      route: '/app/admin/users',
      icon: 'admin',
      permissions: [permissions.system.access],
    },
  ];

  protected readonly visibleMainNavItems = computed(() => this.visibleNavItems(this.mainNavItems));
  protected readonly visibleManageNavItems = computed(() =>
    this.visibleNavItems(this.manageNavItems),
  );

  protected readonly sidebarClass = computed(() => [
    'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-neutral-200 bg-white transition-all duration-200',
    this.isSidebarExpanded() ? 'w-64' : 'w-20',
    this.isMobileSidebarOpen()
      ? 'translate-x-0 shadow-xl lg:shadow-none'
      : '-translate-x-full lg:translate-x-0',
  ]);

  protected readonly contentClass = computed(() => [
    'min-h-dvh transition-all duration-200',
    this.isSidebarExpanded() ? 'lg:pl-64' : 'lg:pl-20',
  ]);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.loadWorkspaceCurrency();
    }
  }

  protected toggleSidebar(): void {
    this.isSidebarExpanded.update((isExpanded) => !isExpanded);
  }

  protected openMobileSidebar(): void {
    this.isMobileSidebarOpen.set(true);
  }

  protected closeMobileSidebar(): void {
    this.isMobileSidebarOpen.set(false);
  }

  protected logout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.authSession
      .logout()
      .pipe(finalize(() => this.isLoggingOut.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/auth/login']),
        error: () => void this.router.navigate(['/auth/login']),
      });
  }

  protected changeWorkspaceCurrency(currency: SupportedCurrency): void {
    if (this.isCurrencySaving() || currency === this.currentCurrency()) {
      return;
    }

    const previousCurrency = this.currentCurrency();
    this.currentCurrency.set(currency);
    this.currencyErrorMessages.set([]);
    this.isCurrencySaving.set(true);

    this.currentUserApi
      .updateCurrentUser({ currency })
      .pipe(
        map((response) => this.unwrap(response, 'Workspace currency could not be updated.')),
        finalize(() => this.isCurrencySaving.set(false)),
      )
      .subscribe({
        next: (profile) => {
          this.currentCurrency.set(this.toSupportedCurrency(profile.currency));
          this.workspaceCurrencyRefresh.notifyCurrencyChanged();
        },
        error: (error) => {
          this.currentCurrency.set(previousCurrency);
          this.currencyErrorMessages.set(extractApiErrors(error));
        },
      });
  }

  private visibleNavItems(items: readonly SidebarNavItem[]): readonly SidebarNavItem[] {
    return items.filter((item) => this.authSession.hasAnyPermission(item.permissions));
  }

  private loadWorkspaceCurrency(): void {
    if (this.isCurrencyLoading()) {
      return;
    }

    this.isCurrencyLoading.set(true);
    this.currencyErrorMessages.set([]);

    this.currentUserApi
      .getCurrentUser()
      .pipe(
        map((response) => this.unwrap(response, 'Workspace currency could not be loaded.')),
        finalize(() => this.isCurrencyLoading.set(false)),
      )
      .subscribe({
        next: (profile) => this.currentCurrency.set(this.toSupportedCurrency(profile.currency)),
        error: (error) => this.currencyErrorMessages.set(extractApiErrors(error)),
      });
  }

  private toSupportedCurrency(value: string): SupportedCurrency {
    const normalized = value?.trim().toUpperCase();

    return this.currencyOptions.includes(normalized as SupportedCurrency)
      ? (normalized as SupportedCurrency)
      : 'USD';
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
