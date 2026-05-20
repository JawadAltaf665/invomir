export type DashboardInvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'overdue'
  | 'cancelled'
  | string;

export type DashboardTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export interface DashboardRevenueDto {
  thisMonth: number;
  lastMonth: number;
  allTime: number;
}

export interface DashboardInvoiceCountsDto {
  draft: number;
  sent: number;
  viewed: number;
  paid: number;
  overdue: number;
  cancelled: number;
}

export interface DashboardRecentInvoiceDto {
  id: string;
  invoiceNumber: string;
  clientName: string;
  status: DashboardInvoiceStatus;
  total: number;
  currency: string;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
}

export interface DashboardTopClientDto {
  id: string;
  name: string;
  revenue: number;
}

export interface DashboardDto {
  revenue: DashboardRevenueDto;
  outstanding: number;
  overdue: number;
  invoiceCounts: DashboardInvoiceCountsDto;
  recentInvoices: readonly DashboardRecentInvoiceDto[];
  topClients: readonly DashboardTopClientDto[];
}

export interface DashboardStatCard {
  id: string;
  label: string;
  value: string;
  helper: string;
  tone: DashboardTone;
}

export interface DashboardStatusMetric {
  id: string;
  label: string;
  count: number;
  percentage: number;
  tone: DashboardTone;
}

export interface DashboardRecentInvoiceItem {
  id: string;
  invoiceNumber: string;
  clientName: string;
  statusLabel: string;
  statusTone: DashboardTone;
  totalDisplay: string;
  dueDateDisplay: string;
  activityLabel: string;
}

export interface DashboardTopClientItem {
  id: string;
  name: string;
  revenueDisplay: string;
  percentage: number;
}

export interface DashboardRevenueBar {
  id: string;
  label: string;
  valueDisplay: string;
  heightPercentage: number;
  tone: DashboardTone;
}

export interface DashboardPaymentSummary {
  totalRevenueDisplay: string;
  clients: readonly DashboardTopClientItem[];
}

export interface DashboardOverdueSummary {
  outstandingDisplay: string;
  overdueDisplay: string;
  overdueCount: number;
  openInvoiceCount: number;
  overduePercentage: number;
  tone: DashboardTone;
}

export interface DashboardAccessBadge {
  id: string;
  label: string;
}

export interface DashboardAccountSummary {
  name: string;
  email: string;
  role: string;
  plan: string;
  trialLabel: string;
  accessBadges: readonly DashboardAccessBadge[];
}
