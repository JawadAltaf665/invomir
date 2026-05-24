import { NgClass, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  untracked,
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
import { CurrentUserProfileDto } from '../../core/models/current-user-profile.model';
import { Permission, permissions } from '../../core/permissions/permissions';
import { apiUrl } from '../../core/config/api-url';
import { CurrentUserApiService } from '../../core/services/current-user-api.service';
import { CurrentUserProfileRefreshService } from '../../core/services/current-user-profile-refresh.service';
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
  protected readonly currentUserProfile = signal<CurrentUserProfileDto | null>(null);
  protected readonly profilePictureVersion = signal(Date.now());
  private readonly router = inject(Router);
  private readonly currentUserApi = inject(CurrentUserApiService);
  private readonly currentUserProfileRefresh = inject(CurrentUserProfileRefreshService);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly currencyLabel = computed(() => this.currentCurrency());
  protected readonly displayUserName = computed(() => {
    const profile = this.currentUserProfile();

    if (profile) {
      return this.formatFullName(profile.firstName, profile.lastName);
    }

    return this.authSession.user()?.firstName ?? 'Account';
  });
  protected readonly displayUserRole = computed(() =>
    this.formatLabel(this.currentUserProfile()?.role ?? this.authSession.role() ?? ''),
  );
  protected readonly displayProfilePictureUrl = computed(() =>
    this.resolveAssetUrl(
      this.currentUserProfile()?.profilePictureUrl ?? null,
      this.profilePictureVersion(),
    ),
  );
  protected readonly displayUserInitials = computed(() => {
    const profile = this.currentUserProfile();

    if (!profile) {
      return this.authSession.user()?.firstName?.charAt(0).toUpperCase() || 'IM';
    }

    const firstInitial = profile.firstName.trim().charAt(0);
    const lastInitial = profile.lastName.trim().charAt(0);
    const initials = `${firstInitial}${lastInitial}`.trim();

    return initials.length > 0 ? initials.toUpperCase() : 'IM';
  });

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
      permissions: [permissions.system.access],
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

  private readonly reloadProfileOnChange = effect(() => {
    const version = this.currentUserProfileRefresh.version();

    if (version === 0 || !isPlatformBrowser(this.platformId)) {
      return;
    }

    untracked(() => this.loadCurrentUserProfile());
  });

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
      this.loadCurrentUserProfile();
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
          this.currentUserProfile.set(profile);
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

  private loadCurrentUserProfile(): void {
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
        next: (profile) => {
          this.currentUserProfile.set(profile);
          this.profilePictureVersion.set(Date.now());
          this.currentCurrency.set(this.toSupportedCurrency(profile.currency));
        },
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

  private formatFullName(firstName: string, lastName: string): string {
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName.length > 0 ? fullName : 'Account';
  }

  private formatLabel(value: string): string {
    if (!value) {
      return 'Role not set';
    }

    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private resolveAssetUrl(assetUrl: string | null, cacheKey: string | number): string | null {
    if (!assetUrl) {
      return null;
    }

    const resolvedUrl = /^https?:\/\//i.test(assetUrl) ? assetUrl : apiUrl(assetUrl);
    const separator = resolvedUrl.includes('?') ? '&' : '?';

    return `${resolvedUrl}${separator}v=${encodeURIComponent(String(cacheKey))}`;
  }
}
