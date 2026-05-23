export const reportMonthOptions = [6, 12, 24] as const;
export const reportMonths = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
] as const;

export const reportExportFormats = ['csv', 'pdf'] as const;
export type ReportExportFormat = (typeof reportExportFormats)[number];

export const reportInvoiceStatuses = [
  'draft',
  'sent',
  'viewed',
  'paid',
  'overdue',
  'cancelled',
] as const;

export type ReportInvoiceStatus = (typeof reportInvoiceStatuses)[number];
export type ReportTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export interface MonthlyReportsDto {
  months: readonly MonthlyReportMonthDto[];
}

export interface MonthlyReportMonthDto {
  month: string;
  paid: number;
  outstanding: number;
  overdue: number;
  invoiceCount: number;
}

export interface MonthlyReportsQuery {
  months: number;
  year: number | null;
  month: number | null;
}

export interface ReportFilters extends MonthlyReportsQuery {
  mode: 'rolling' | 'year' | 'month';
}

export interface ReportExportQuery {
  format: ReportExportFormat;
  from: string;
  to: string;
  status: ReportInvoiceStatus | null;
}

export interface ReportSummaryCardView {
  label: string;
  value: string;
  helper: string;
  tone: ReportTone;
}

export interface ReportMonthView {
  id: string;
  month: string;
  monthLabel: string;
  paidDisplay: string;
  outstandingDisplay: string;
  overdueDisplay: string;
  invoiceCountDisplay: string;
  paid: number;
  outstanding: number;
  overdue: number;
  invoiceCount: number;
}

export interface ReportChartMonthView {
  id: string;
  label: string;
  paidHeight: number;
  outstandingHeight: number;
  overdueHeight: number;
  paidDisplay: string;
  outstandingDisplay: string;
  overdueDisplay: string;
}
