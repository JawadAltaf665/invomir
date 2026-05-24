import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map } from 'rxjs';

import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  DashboardDto,
  DashboardInvoiceCountsDto,
  DashboardOverdueSummary,
  DashboardPaymentSummary,
  DashboardRecentInvoiceDto,
  DashboardRecentInvoiceItem,
  DashboardRevenueBar,
  DashboardStatCard,
  DashboardStatusMetric,
  DashboardTone,
  DashboardTopClientItem,
} from '../models/dashboard.models';
import { DashboardApiService } from '../services/dashboard-api.service';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly dashboardSignal = signal<DashboardDto | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly errorMessagesSignal = signal<readonly string[]>([]);
  private readonly lastLoadedAtSignal = signal<Date | null>(null);
  private readonly cachedSessionKeySignal = signal<string | null>(null);
  private activeRequestSessionKey: string | null = null;

  readonly dashboard = this.dashboardSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly errorMessages = this.errorMessagesSignal.asReadonly();
  readonly lastLoadedAt = this.lastLoadedAtSignal.asReadonly();

  readonly currency = computed(() => this.resolveCurrency(this.dashboard()));

  readonly totalInvoiceCount = computed(() => {
    const counts = this.dashboard()?.invoiceCounts;
    return counts ? this.sumInvoiceCounts(counts) : 0;
  });

  readonly statCards = computed<readonly DashboardStatCard[]>(() => {
    const dashboard = this.dashboard();

    if (!dashboard) {
      return [];
    }

    const currency = this.resolveCurrency(dashboard);
    const counts = dashboard.invoiceCounts;
    const openInvoiceCount = counts.sent + counts.viewed + counts.overdue;

    return [
      {
        id: 'this-month-revenue',
        label: 'This month',
        value: this.formatCurrency(dashboard.revenue.thisMonth, currency),
        helper: this.formatRevenueChangeLabel(
          dashboard.revenue.thisMonth,
          dashboard.revenue.lastMonth,
        ),
        tone: 'primary',
      },
      {
        id: 'outstanding',
        label: 'Outstanding',
        value: this.formatCurrency(dashboard.outstanding, currency),
        helper: `${openInvoiceCount} ${this.pluralize('open invoice', openInvoiceCount)}`,
        tone: dashboard.outstanding > 0 ? 'warning' : 'neutral',
      },
      {
        id: 'overdue',
        label: 'Overdue',
        value: this.formatCurrency(dashboard.overdue, currency),
        helper:
          dashboard.invoiceCounts.overdue > 0
            ? `${dashboard.invoiceCounts.overdue} ${this.pluralize('invoice', dashboard.invoiceCounts.overdue)} need attention`
            : 'No overdue invoices',
        tone: dashboard.overdue > 0 ? 'danger' : 'success',
      },
      {
        id: 'all-time-revenue',
        label: 'All-time revenue',
        value: this.formatCurrency(dashboard.revenue.allTime, currency),
        helper: `Revenue counts only paid invoices. ${counts.paid} ${this.pluralize('paid invoice', counts.paid)}`,
        tone: 'success',
      },
    ];
  });

  readonly statusMetrics = computed<readonly DashboardStatusMetric[]>(() => {
    const counts = this.dashboard()?.invoiceCounts;

    if (!counts) {
      return [];
    }

    const total = this.sumInvoiceCounts(counts);

    return [
      this.toStatusMetric('draft', 'Draft', counts.draft, total, 'neutral'),
      this.toStatusMetric('sent', 'Sent', counts.sent, total, 'primary'),
      this.toStatusMetric('viewed', 'Viewed', counts.viewed, total, 'primary'),
      this.toStatusMetric('paid', 'Paid', counts.paid, total, 'success'),
      this.toStatusMetric('overdue', 'Overdue', counts.overdue, total, 'danger'),
      this.toStatusMetric('cancelled', 'Cancelled', counts.cancelled, total, 'neutral'),
    ];
  });

  readonly recentInvoiceItems = computed<readonly DashboardRecentInvoiceItem[]>(() => {
    const dashboard = this.dashboard();

    if (!dashboard) {
      return [];
    }

    const currency = this.resolveCurrency(dashboard);
    return dashboard.recentInvoices.map((invoice) => this.toRecentInvoiceItem(invoice, currency));
  });

  readonly monthlyRevenueBars = computed<readonly DashboardRevenueBar[]>(() => {
    const dashboard = this.dashboard();

    if (!dashboard) {
      return [];
    }

    const currency = this.resolveCurrency(dashboard);
    const maxRevenue = Math.max(dashboard.revenue.lastMonth, dashboard.revenue.thisMonth, 1);

    return [
      {
        id: 'last-month',
        label: 'Last month',
        value: dashboard.revenue.lastMonth,
        valueDisplay: this.formatCurrency(dashboard.revenue.lastMonth, currency),
        heightPercentage: this.toBarHeight(dashboard.revenue.lastMonth, maxRevenue),
        tone: 'neutral',
      },
      {
        id: 'this-month',
        label: 'This month',
        value: dashboard.revenue.thisMonth,
        valueDisplay: this.formatCurrency(dashboard.revenue.thisMonth, currency),
        heightPercentage: this.toBarHeight(dashboard.revenue.thisMonth, maxRevenue),
        tone: 'primary',
      },
    ];
  });

  readonly revenueChangeLabel = computed(() => {
    const revenue = this.dashboard()?.revenue;
    return revenue ? this.formatRevenueChangeLabel(revenue.thisMonth, revenue.lastMonth) : '';
  });

  readonly allTimeRevenueDisplay = computed(() => {
    const dashboard = this.dashboard();
    return dashboard
      ? this.formatCurrency(dashboard.revenue.allTime, this.resolveCurrency(dashboard))
      : '';
  });

  readonly paymentSummary = computed<DashboardPaymentSummary>(() => {
    const dashboard = this.dashboard();

    if (!dashboard) {
      return {
        totalRevenueDisplay: '',
        clients: [],
      };
    }

    const currency = this.resolveCurrency(dashboard);
    const denominator = Math.max(dashboard.revenue.allTime, 0);

    return {
      totalRevenueDisplay: this.formatCurrency(dashboard.revenue.allTime, currency),
      clients: dashboard.topClients.map((client) => ({
        id: client.id,
        name: client.name,
        amountDisplay: this.formatCurrency(
          client.revenue > 0 ? client.revenue : client.invoiceVolume,
          currency,
        ),
        helper:
          client.revenue > 0
            ? `${client.invoiceCount} ${this.pluralize('invoice', client.invoiceCount)} paid`
            : `${client.invoiceCount} ${this.pluralize('invoice', client.invoiceCount)} booked, unpaid volume`,
        percentage:
          denominator > 0
            ? Math.min(100, Math.round((client.revenue / denominator) * 100))
            : client.invoiceVolume > 0
              ? 100
              : 0,
      })),
    };
  });

  readonly overdueSummary = computed<DashboardOverdueSummary>(() => {
    const dashboard = this.dashboard();

    if (!dashboard) {
      return {
        outstandingDisplay: '',
        overdueDisplay: '',
        overdueCount: 0,
        openInvoiceCount: 0,
        overduePercentage: 0,
        tone: 'neutral',
      };
    }

    const currency = this.resolveCurrency(dashboard);
    const overduePercentage =
      dashboard.outstanding > 0
        ? Math.min(100, Math.round((dashboard.overdue / dashboard.outstanding) * 100))
        : 0;
    const openInvoiceCount =
      dashboard.invoiceCounts.sent +
      dashboard.invoiceCounts.viewed +
      dashboard.invoiceCounts.overdue;

    return {
      outstandingDisplay: this.formatCurrency(dashboard.outstanding, currency),
      overdueDisplay: this.formatCurrency(dashboard.overdue, currency),
      overdueCount: dashboard.invoiceCounts.overdue,
      openInvoiceCount,
      overduePercentage,
      tone: dashboard.overdue > 0 ? 'danger' : dashboard.outstanding > 0 ? 'warning' : 'success',
    };
  });

  load(force = false): void {
    const sessionKey = this.currentSessionKey();

    if (!sessionKey) {
      this.clear();
      return;
    }

    if (this.cachedSessionKeySignal() !== sessionKey) {
      this.clear();
    }

    if (this.isLoading() && this.activeRequestSessionKey === sessionKey) {
      return;
    }

    if (this.dashboard() && !force) {
      return;
    }

    this.activeRequestSessionKey = sessionKey;
    this.isLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.dashboardApi
      .getDashboard()
      .pipe(
        map((response) => this.unwrap(response)),
        finalize(() => {
          if (this.activeRequestSessionKey === sessionKey) {
            this.activeRequestSessionKey = null;
            this.isLoadingSignal.set(false);
          }
        }),
      )
      .subscribe({
        next: (dashboard) => {
          if (this.currentSessionKey() !== sessionKey) {
            return;
          }

          this.dashboardSignal.set(dashboard);
          this.cachedSessionKeySignal.set(sessionKey);
          this.lastLoadedAtSignal.set(new Date());
        },
        error: (error) => {
          if (this.currentSessionKey() !== sessionKey) {
            return;
          }

          this.errorMessagesSignal.set(extractApiErrors(error));
        },
      });
  }

  refresh(): void {
    this.load(true);
  }

  clear(): void {
    this.dashboardSignal.set(null);
    this.errorMessagesSignal.set([]);
    this.lastLoadedAtSignal.set(null);
    this.cachedSessionKeySignal.set(null);
    this.activeRequestSessionKey = null;
    this.isLoadingSignal.set(false);
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? 'Dashboard request failed.';
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }

  private currentSessionKey(): string | null {
    const user = this.authSession.user();

    if (!user?.id || !user.tenantId) {
      return null;
    }

    return `${user.tenantId}:${user.id}`;
  }

  private toStatusMetric(
    id: string,
    label: string,
    count: number,
    total: number,
    tone: DashboardTone,
  ): DashboardStatusMetric {
    return {
      id,
      label,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      tone,
    };
  }

  private toRecentInvoiceItem(
    invoice: DashboardRecentInvoiceDto,
    workspaceCurrency: string,
  ): DashboardRecentInvoiceItem {
    const dueDateTone = this.toDueDateTone(invoice);

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      clientName: invoice.clientName,
      statusLabel: this.toTitleCase(invoice.status),
      statusTone: this.toStatusTone(invoice.status),
      totalDisplay: this.formatCurrency(invoice.total, workspaceCurrency),
      dueDateDisplay: this.formatDate(invoice.dueDate),
      dueDateTone,
      activityLabel: this.invoiceActivityLabel(invoice),
    };
  }

  private invoiceActivityLabel(invoice: DashboardRecentInvoiceDto): string {
    if (invoice.paidAt) {
      return `Paid ${this.formatDate(invoice.paidAt)}`;
    }

    if (invoice.sentAt) {
      return `Sent ${this.formatDate(invoice.sentAt)}`;
    }

    return `Due ${this.formatDate(invoice.dueDate)}`;
  }

  private toStatusTone(status: string): DashboardTone {
    const normalizedStatus = status.toLowerCase();

    if (normalizedStatus === 'paid') {
      return 'success';
    }

    if (normalizedStatus === 'overdue') {
      return 'danger';
    }

    if (normalizedStatus === 'sent' || normalizedStatus === 'viewed') {
      return 'primary';
    }

    return 'neutral';
  }

  private toDueDateTone(invoice: DashboardRecentInvoiceDto): DashboardTone {
    const normalizedStatus = invoice.status.toLowerCase();
    const dueDate = new Date(`${invoice.dueDate}T00:00:00`);

    if (Number.isNaN(dueDate.getTime())) {
      return 'neutral';
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (normalizedStatus === 'draft' && dueDate.getTime() < today.getTime()) {
      return 'warning';
    }

    if (normalizedStatus === 'overdue') {
      return 'danger';
    }

    return 'neutral';
  }

  private resolveCurrency(dashboard: DashboardDto | null): string {
    return dashboard?.currency ?? 'USD';
  }

  private formatCurrency(value: number, currency: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
      }).format(value);
    } catch {
      return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)}`;
    }
  }

  private formatDate(value: string): string {
    const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);

    if (Number.isNaN(date.getTime())) {
      return 'Not set';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  }

  private formatRevenueChangeLabel(currentValue: number, previousValue: number): string {
    if (previousValue === 0 && currentValue === 0) {
      return 'No revenue yet this month';
    }

    if (previousValue === 0) {
      return 'New revenue compared with last month';
    }

    const change = ((currentValue - previousValue) / previousValue) * 100;
    const prefix = change > 0 ? '+' : '';
    return `${prefix}${change.toFixed(1)}% vs last month`;
  }

  private sumInvoiceCounts(counts: DashboardInvoiceCountsDto): number {
    return (
      counts.draft + counts.sent + counts.viewed + counts.paid + counts.overdue + counts.cancelled
    );
  }

  private toBarHeight(value: number, maxValue: number): number {
    if (value <= 0) {
      return 6;
    }

    return Math.max(12, Math.round((value / maxValue) * 100));
  }

  private toTitleCase(value: string): string {
    return value
      .replace(/[-_]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
      .join(' ');
  }

  private pluralize(label: string, count: number): string {
    return count === 1 ? label : `${label}s`;
  }
}
