import { NgClass, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import { Dir } from '@angular/cdk/bidi';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
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
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideBadgeDollarSign,
  LucideChartNoAxesCombined,
  LucideChevronDown,
  LucideCreditCard,
  LucideFileText,
  LucideHistory,
  LucideLayoutDashboard,
  LucideLanguages,
  LucideLogOut,
  LucideMenu,
  LucidePanelLeftClose,
  LucidePanelLeftOpen,
  LucideReceiptText,
  LucideSettings,
  LucideShieldCheck,
  LucideUsers,
} from '@lucide/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, finalize, map } from 'rxjs';

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
import { LanguagePreferenceService } from '../../core/i18n/language-preference.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationService } from '../../core/i18n/translation.service';
import { SupportedLanguage } from '../../core/i18n/language.config';
import { NotificationBellComponent } from '../../features/notifications/components/notification-bell/notification-bell.component';

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
  labelKey: string;
  route: string;
  icon: SidebarIcon;
  permissions: readonly Permission[];
  disabled?: boolean;
  requiresBusinessPlan?: boolean;
}

interface SidebarSubNavItem {
  labelKey: string;
  route: string;
  icon: SidebarIcon;
  permissions: readonly Permission[];
}

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [
    NgClass,
    NgTemplateOutlet,
    Dir,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideBadgeDollarSign,
    LucideChartNoAxesCombined,
    LucideChevronDown,
    LucideCreditCard,
    LucideFileText,
    LucideHistory,
    LucideLayoutDashboard,
    LucideLanguages,
    LucideLogOut,
    LucideMenu,
    LucidePanelLeftClose,
    LucidePanelLeftOpen,
    LucideReceiptText,
    LucideSettings,
    LucideShieldCheck,
    LucideUsers,
    NotificationBellComponent,
    TranslatePipe,
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
  protected readonly currentUrl = signal('');
  protected readonly profilePictureVersion = signal(Date.now());
  protected readonly isAdminMenuOpen = signal(false);
  protected readonly languagePreference = inject(LanguagePreferenceService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentUserApi = inject(CurrentUserApiService);
  private readonly currentUserProfileRefresh = inject(CurrentUserProfileRefreshService);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly translation = inject(TranslationService);

  protected readonly currencyLabel = computed(() => this.currentCurrency());
  protected readonly displayUserName = computed(() => {
    const profile = this.currentUserProfile();

    if (profile) {
      return this.formatFullName(profile.firstName, profile.lastName);
    }

    return this.authSession.user()?.firstName ?? this.translation.translate('common.account');
  });
  protected readonly displayUserRole = computed(() =>
    this.translateRole(this.currentUserProfile()?.role ?? this.authSession.role() ?? ''),
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
  protected readonly isBusinessPlan = computed(
    () => this.authSession.user()?.plan?.toString().toLowerCase() === 'business',
  );

  private readonly mainNavItems: readonly SidebarNavItem[] = [
    {
      labelKey: 'navigation.dashboard',
      route: '/app/dashboard',
      icon: 'dashboard',
      permissions: [permissions.dashboard.view],
    },
    {
      labelKey: 'navigation.invoices',
      route: '/app/invoices',
      icon: 'invoices',
      permissions: [permissions.invoice.view],
    },
    {
      labelKey: 'navigation.clients',
      route: '/app/clients',
      icon: 'clients',
      permissions: [permissions.client.view],
    },
    {
      labelKey: 'navigation.payments',
      route: '/app/payments',
      icon: 'payments',
      permissions: [permissions.payment.view],
    },
    {
      labelKey: 'navigation.reports',
      route: '/app/reports',
      icon: 'reports',
      permissions: [permissions.report.view],
    },
  ];

  private readonly manageNavItems: readonly SidebarNavItem[] = [
    {
      labelKey: 'navigation.subscriptions',
      route: '/app/subscriptions',
      icon: 'subscriptions',
      permissions: [permissions.subscription.view],
    },
    {
      labelKey: 'navigation.team',
      route: '/app/team',
      icon: 'team',
      permissions: [permissions.team.manage],
      requiresBusinessPlan: true,
    },
    {
      labelKey: 'navigation.auditLogs',
      route: '/app/audit-logs',
      icon: 'auditLogs',
      permissions: [permissions.system.access],
    },
    {
      labelKey: 'navigation.settings',
      route: '/app/settings',
      icon: 'settings',
      permissions: [permissions.settings.manage],
    },
  ];

  private readonly adminSubNavItems: readonly SidebarSubNavItem[] = [
    {
      labelKey: 'navigation.emailTemplates',
      route: '/app/admin/email-templates',
      icon: 'invoices',
      permissions: [permissions.system.access],
    },
    {
      labelKey: 'navigation.queuedEmails',
      route: '/app/admin/queued-emails',
      icon: 'auditLogs',
      permissions: [permissions.system.access],
    },
    {
      labelKey: 'navigation.users',
      route: '/app/admin/users',
      icon: 'team',
      permissions: [permissions.system.users.view],
    },
  ];

  protected readonly visibleMainNavItems = computed(() => this.visibleNavItems(this.mainNavItems));
  protected readonly visibleManageNavItems = computed(() =>
    this.visibleNavItems(this.manageNavItems),
  );
  protected readonly visibleAdminSubNavItems = computed(() =>
    this.visibleSubNavItems(this.adminSubNavItems),
  );
  protected readonly hasVisibleManageItems = computed(
    () => this.visibleManageNavItems().length > 0 || this.visibleAdminSubNavItems().length > 0,
  );
  protected readonly isAdminRouteActive = computed(() => this.currentUrl().startsWith('/app/admin'));

  private readonly reloadProfileOnChange = effect(() => {
    const version = this.currentUserProfileRefresh.version();

    if (version === 0 || !isPlatformBrowser(this.platformId)) {
      return;
    }

    untracked(() => this.loadCurrentUserProfile());
  });

  protected readonly sidebarClass = computed(() => [
    'fixed inset-y-0 z-40 flex flex-col border-neutral-200 bg-white transition-all duration-200',
    this.languagePreference.direction() === 'rtl' ? 'right-0 border-l' : 'left-0 border-r',
    this.isSidebarExpanded() ? 'w-64' : 'w-20',
    this.isMobileSidebarOpen()
      ? 'translate-x-0 shadow-xl lg:shadow-none'
      : this.languagePreference.direction() === 'rtl'
        ? 'translate-x-full lg:translate-x-0'
        : '-translate-x-full lg:translate-x-0',
  ]);

  protected readonly contentClass = computed(() => [
    'min-h-dvh transition-all duration-200',
    this.languagePreference.direction() === 'rtl'
      ? this.isSidebarExpanded()
        ? 'lg:pr-64'
        : 'lg:pr-20'
      : this.isSidebarExpanded()
        ? 'lg:pl-64'
        : 'lg:pl-20',
  ]);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.languagePreference.load();
      this.loadCurrentUserProfile();
    }

    this.currentUrl.set(this.router.url);
    if (this.router.url.startsWith('/app/admin')) {
      this.isAdminMenuOpen.set(true);
    }

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        if (event.urlAfterRedirects.startsWith('/app/admin')) {
          this.isAdminMenuOpen.set(true);
        }
      });
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

  protected toggleAdminMenu(): void {
    if (!this.isSidebarExpanded()) {
      this.isSidebarExpanded.set(true);
      this.isAdminMenuOpen.set(true);
      return;
    }

    this.isAdminMenuOpen.update((isOpen) => !isOpen);
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
    return items.filter(
      (item) =>
        this.authSession.hasAnyPermission(item.permissions) &&
        (!item.requiresBusinessPlan || this.isBusinessPlan()),
    );
  }

  private visibleSubNavItems(items: readonly SidebarSubNavItem[]): readonly SidebarSubNavItem[] {
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

  protected changeLanguage(language: SupportedLanguage): void {
    this.languagePreference.changeLanguage(language);
  }

  protected navLabel(item: SidebarNavItem): string {
    return this.translation.translate(item.labelKey);
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
    return fullName.length > 0 ? fullName : this.translation.translate('common.account');
  }

  private formatLabel(value: string): string {
    if (!value) {
      return this.translation.translate('roles.notSet');
    }

    return value
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private translateRole(value: string): string {
    if (!value) {
      return this.translation.translate('roles.notSet');
    }

    const translationKey = `roles.${value}`;
    const translatedRole = this.translation.translate(translationKey);
    return translatedRole === translationKey ? this.formatLabel(value) : translatedRole;
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
