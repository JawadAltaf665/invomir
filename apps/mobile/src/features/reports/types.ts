export interface MonthlyReportsDto {
  currency: string;
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
  year?: number | null;
  month?: number | null;
}

export type ReportExportFormat = 'csv' | 'pdf';
export type ReportInvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

export interface ReportExportQuery {
  format: ReportExportFormat;
  from: string;
  to: string;
  status: ReportInvoiceStatus | null;
}

export interface ReportExportResult {
  fileName: string;
  contentType: string;
  uri?: string;
}
