import { Injectable, computed, inject, signal } from '@angular/core';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  MonthlyReportMonthDto,
  MonthlyReportsDto,
  ReportChartMonthView,
  ReportFilters,
  ReportMonthView,
  ReportSummaryCardView,
} from '../models/report.models';
import { ReportApiService } from '../services/report-api.service';
import {
  averageValue,
  formatReportCount,
  formatReportMetric,
  formatReportMonth,
  formatReportMonthShort,
  safePercentage,
  sumValues,
} from '../utils/report-formatters';

const defaultFilters: ReportFilters = {
  mode: 'rolling',
  months: 12,
  year: null,
  month: null,
};

@Injectable({ providedIn: 'root' })
export class ReportStore {
  private readonly reportApi = inject(ReportApiService);
  private readonly resultSignal = signal<MonthlyReportsDto | null>(null);
  private readonly filtersSignal = signal<ReportFilters>(defaultFilters);
  private readonly isLoadingSignal = signal(false);
  private readonly errorMessagesSignal = signal<readonly string[]>([]);

  readonly result = this.resultSignal.asReadonly();
  readonly filters = this.filtersSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly errorMessages = this.errorMessagesSignal.asReadonly();

  readonly rows = computed<readonly ReportMonthView[]>(() =>
    (this.result()?.months ?? []).map((month) => this.toMonthView(month)),
  );

  readonly hasData = computed(() =>
    this.rows().some(
      (month) =>
        month.paid > 0 || month.outstanding > 0 || month.overdue > 0 || month.invoiceCount > 0,
    ),
  );

  readonly totals = computed(() => {
    const rows = this.rows();
    const paid = sumValues(rows.map((month) => month.paid));
    const outstanding = sumValues(rows.map((month) => month.outstanding));
    const overdue = sumValues(rows.map((month) => month.overdue));
    const invoiceCount = rows.reduce((sum, month) => sum + month.invoiceCount, 0);

    return {
      paid,
      outstanding,
      overdue,
      invoiceCount,
      monthCount: rows.length,
    };
  });

  readonly summaryCards = computed<readonly ReportSummaryCardView[]>(() => {
    const totals = this.totals();

    return [
      {
        label: 'Paid',
        value: formatReportMetric(totals.paid),
        helper: `${averageValue(totals.paid, totals.monthCount)} average per period`,
        tone: 'success',
      },
      {
        label: 'Outstanding',
        value: formatReportMetric(totals.outstanding),
        helper: 'Sent, viewed, and overdue invoices',
        tone: 'primary',
      },
      {
        label: 'Overdue',
        value: formatReportMetric(totals.overdue),
        helper: 'Past due invoice exposure',
        tone: 'danger',
      },
      {
        label: 'Invoices',
        value: formatReportCount(totals.invoiceCount),
        helper: `${formatReportCount(totals.monthCount)} report periods`,
        tone: 'neutral',
      },
    ];
  });

  readonly chartMonths = computed<readonly ReportChartMonthView[]>(() => {
    const rows = this.rows();
    const maxValue = Math.max(
      0,
      ...rows.flatMap((month) => [month.paid, month.outstanding, month.overdue]),
    );

    return rows.map((month) => ({
      id: month.id,
      label: formatReportMonthShort(month.month),
      paidHeight: safePercentage(month.paid, maxValue),
      outstandingHeight: safePercentage(month.outstanding, maxValue),
      overdueHeight: safePercentage(month.overdue, maxValue),
      paidDisplay: month.paidDisplay,
      outstandingDisplay: month.outstandingDisplay,
      overdueDisplay: month.overdueDisplay,
    }));
  });

  readonly periodLabel = computed(() => {
    const filters = this.filters();

    if (filters.mode === 'year' && filters.year) {
      return `${filters.year} annual view`;
    }

    if (filters.mode === 'month' && filters.year && filters.month) {
      const label = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
      }).format(new Date(filters.year, filters.month - 1, 1));

      return label;
    }

    return `Last ${filters.months} months`;
  });

  loadReports(overrides: Partial<ReportFilters> = {}): void {
    if (this.isLoading()) {
      return;
    }

    const nextFilters = this.normalizeFilters({ ...this.filters(), ...overrides });
    this.filtersSignal.set(nextFilters);
    this.isLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.reportApi
      .getMonthlyReports(nextFilters)
      .pipe(
        map((response) => this.unwrap(response, 'Reports request failed.')),
        finalize(() => this.isLoadingSignal.set(false)),
      )
      .subscribe({
        next: (result) => this.resultSignal.set(result),
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  resetFilters(): void {
    this.loadReports(defaultFilters);
  }

  private normalizeFilters(filters: ReportFilters): ReportFilters {
    const mode = filters.mode ?? 'rolling';
    const year = filters.year ? Math.min(2100, Math.max(2000, filters.year)) : null;
    const month = filters.month ? Math.min(12, Math.max(1, filters.month)) : null;

    if (mode === 'year') {
      return {
        ...filters,
        mode,
        months: 12,
        year,
        month: null,
      };
    }

    if (mode === 'month') {
      return {
        ...filters,
        mode,
        months: 1,
        year,
        month: year ? month : null,
      };
    }

    return {
      ...filters,
      mode: 'rolling',
      months: Math.min(24, Math.max(1, filters.months || 12)),
      year: null,
      month: null,
    };
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }

  private toMonthView(month: MonthlyReportMonthDto): ReportMonthView {
    return {
      id: month.month,
      month: month.month,
      monthLabel: formatReportMonth(month.month),
      paidDisplay: formatReportMetric(month.paid),
      outstandingDisplay: formatReportMetric(month.outstanding),
      overdueDisplay: formatReportMetric(month.overdue),
      invoiceCountDisplay: formatReportCount(month.invoiceCount),
      paid: month.paid,
      outstanding: month.outstanding,
      overdue: month.overdue,
      invoiceCount: month.invoiceCount,
    };
  }
}
