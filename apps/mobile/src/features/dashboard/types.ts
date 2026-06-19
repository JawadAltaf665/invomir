export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

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
  status: InvoiceStatus;
  total: number;
  currency: string;
  originalTotal: number;
  originalCurrency: string;
  exchangeRate: number;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
}

export interface DashboardTopClientDto {
  id: string;
  name: string;
  revenue: number;
  invoiceVolume: number;
  invoiceCount: number;
}

export interface DashboardDto {
  currency: string;
  workspaceRole: string;
  revenue: DashboardRevenueDto;
  outstanding: number;
  overdue: number;
  invoiceCounts: DashboardInvoiceCountsDto;
  recentInvoices: readonly DashboardRecentInvoiceDto[];
  topClients: readonly DashboardTopClientDto[];
}

export type DashboardActionItemType = 'info' | 'success' | 'warning' | 'critical' | string;

export interface DashboardActionItemDto {
  id: string;
  type: DashboardActionItemType;
  title: string;
  message: string;
  actionLabel: string | null;
  actionUrl: string | null;
  dismissible: boolean;
  priority: number;
}

export interface DashboardActionItemsDto {
  items: readonly DashboardActionItemDto[];
}
