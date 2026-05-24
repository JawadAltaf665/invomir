import { ReportInvoiceStatus, ReportTone } from '../models/report.models';

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});

const metricFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

const statusLabels: Record<ReportInvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export function reportStatusLabel(status: ReportInvoiceStatus): string {
  return statusLabels[status];
}

export function formatReportMetric(value: number | null | undefined, currency: string): string {
  const safeValue = Number(value ?? 0);
  const normalizedCurrency = currency?.trim().toUpperCase() || 'USD';

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(safeValue) ? safeValue : 0);
  } catch {
    return `${normalizedCurrency} ${metricFormatter.format(Number.isFinite(safeValue) ? safeValue : 0)}`;
  }
}

export function formatReportCount(value: number | null | undefined): string {
  const safeValue = Number(value ?? 0);
  return numberFormatter.format(Number.isFinite(safeValue) ? safeValue : 0);
}

export function formatReportMonth(value: string): string {
  const [year, month] = value.split('-').map(Number);

  if (!year || !month) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

export function formatReportMonthShort(value: string): string {
  const [year, month] = value.split('-').map(Number);

  if (!year || !month) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
  }).format(new Date(year, month - 1, 1));
}

export function reportToneDotClass(tone: ReportTone): string {
  const toneClassByKey: Record<ReportTone, string> = {
    neutral: 'bg-neutral-300',
    primary: 'bg-primary',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return `mt-1 size-2.5 shrink-0 rounded-full ${toneClassByKey[tone]}`;
}

export function buildReportFileName(format: 'csv' | 'pdf', from: string, to: string): string {
  return `invomir-report-${from}-${to}.${format}`;
}

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function defaultExportRange(): { from: string; to: string } {
  const now = new Date();
  const to = toIsoDate(now);
  const fromDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  return {
    from: toIsoDate(fromDate),
    to,
  };
}

export function safePercentage(value: number, maxValue: number): number {
  if (maxValue <= 0 || value <= 0) {
    return 4;
  }

  return Math.max(8, Math.round((value / maxValue) * 100));
}

export function sumValues(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + (Number.isFinite(value) ? value : 0), 0);
}

export function averageValue(total: number, count: number): string {
  return metricFormatter.format(count > 0 ? total / count : 0);
}
