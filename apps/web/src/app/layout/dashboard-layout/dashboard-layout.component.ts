import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideBell,
  LucideChartNoAxesCombined,
  LucideCreditCard,
  LucideFileText,
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
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../core/auth/auth-session.service';
import { Permission, permissions } from '../../core/permissions/permissions';

type SidebarIcon =
  | 'dashboard'
  | 'invoices'
  | 'clients'
  | 'payments'
  | 'reports'
  | 'subscriptions'
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
    MatTooltipModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    LucideBell,
    LucideChartNoAxesCombined,
    LucideCreditCard,
    LucideFileText,
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
export class DashboardLayoutComponent {
  protected readonly authSession = inject(AuthSessionService);
  protected readonly isLoggingOut = signal(false);
  protected readonly isSidebarExpanded = signal(true);
  protected readonly isMobileSidebarOpen = signal(false);
  private readonly router = inject(Router);

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
      disabled: true,
    },
    {
      label: 'Settings',
      route: '/app/settings',
      icon: 'settings',
      permissions: [permissions.settings.manage],
    },
    {
      label: 'Admin',
      route: '/app/admin',
      icon: 'admin',
      permissions: [permissions.system.access],
      disabled: true,
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

  private visibleNavItems(items: readonly SidebarNavItem[]): readonly SidebarNavItem[] {
    return items.filter((item) => this.authSession.hasAnyPermission(item.permissions));
  }
}
