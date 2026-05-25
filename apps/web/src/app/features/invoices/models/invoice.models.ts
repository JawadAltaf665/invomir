import { PagedResult } from '../../../core/models/api-response.model';

export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
export type InvoicePaymentTerms = 'due_on_receipt' | 'net_7' | 'net_14' | 'net_30';
export type InvoiceDiscountType = 'fixed' | 'percent';
export type InvoicePaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'other';

export const invoiceStatuses = [
  'draft',
  'sent',
  'viewed',
  'paid',
  'overdue',
  'cancelled',
] as const satisfies readonly InvoiceStatus[];

export const invoicePaymentTerms = [
  'due_on_receipt',
  'net_7',
  'net_14',
  'net_30',
] as const satisfies readonly InvoicePaymentTerms[];

export const invoiceDiscountTypes = [
  'fixed',
  'percent',
] as const satisfies readonly InvoiceDiscountType[];

export const invoicePaymentMethods = [
  'cash',
  'bank_transfer',
  'cheque',
  'other',
] as const satisfies readonly InvoicePaymentMethod[];

export const supportedInvoiceCurrencies = ['USD', 'PKR', 'AED', 'GBP', 'EUR', 'SAR'] as const;

export interface InvoiceListItemDto {
  id: string;
  invoiceNumber: string;
  clientName: string;
  status: InvoiceStatus;
  total: number;
  currency: string;
  originalTotal: number;
  originalCurrency: string;
  exchangeRate: number;
  ratesUpdatedAt: string | null;
  dueDate: string;
  sentAt: string | null;
}

export interface InvoiceClientDto {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  taxId?: string | null;
}

export interface InvoiceIssuerDto {
  businessName: string;
  email?: string | null;
  logoUrl?: string | null;
}

export interface InvoiceItemDto {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  sortOrder: number;
}

export interface InvoiceDetailDto {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  client: InvoiceClientDto;
  items: readonly InvoiceItemDto[];
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  notes: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  remindersEnabled: boolean;
  issuer?: InvoiceIssuerDto | null;
}

export interface InvoiceItemInputDto {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceDiscountDto {
  type: InvoiceDiscountType;
  value: number;
}

export interface InvoiceSaveRequest {
  clientId: string;
  dueDate?: string | null;
  paymentTerms?: InvoicePaymentTerms | null;
  taxPercent?: number | null;
  discount?: InvoiceDiscountDto | null;
  notes?: string | null;
  items: readonly InvoiceItemInputDto[];
}

export interface InvoiceListQuery {
  status?: InvoiceStatus | null;
  clientId?: string | null;
  from?: string | null;
  to?: string | null;
  searchTerm?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
  sortBy?: InvoiceListSortBy | null;
  sortDirection?: InvoiceListSortDirection | null;
  page: number;
  limit: number;
}

export interface InvoiceSendRequest {
  message?: string | null;
  ccSelf?: boolean;
}

export interface InvoiceSendResultDto {
  id: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  sentAt: string | null;
  paymentLink: string;
  remindersScheduledAtUtc: readonly string[];
}

export interface InvoicePaymentRequest {
  paidAt?: string | null;
  method?: InvoicePaymentMethod | null;
  note?: string | null;
}

export interface InvoicePaymentDto {
  invoiceId: string;
  paymentId: string;
  status: InvoiceStatus;
  amount: number;
  currency: string;
  method: string;
  paidAt: string;
  cancelledReminderJobCount: number;
}

export interface InvoiceReminderRequest {
  enabled: boolean;
}

export interface InvoiceReminderSettingsDto {
  invoiceId: string;
  remindersEnabled: boolean;
  scheduledRemindersCancelled: number;
  remindersScheduledAtUtc: readonly string[];
}

export interface InvoiceDuplicateRequest {
  clientId?: string | null;
  dueDate?: string | null;
}

export interface InvoiceCancellationDto {
  id: string;
  status: InvoiceStatus;
  cancelledAt: string | null;
}

export interface InvoiceClientListItemDto {
  id: string;
  name: string;
  email: string;
  company: string | null;
  totalRevenue: number;
  invoiceCount: number;
}

export interface InvoiceListFilters extends InvoiceListQuery {
  searchTerm: string;
  minAmount: number | null;
  maxAmount: number | null;
  sortBy: InvoiceListSortBy;
  sortDirection: InvoiceListSortDirection;
}

export interface InvoiceListItemView {
  id: string;
  invoiceNumber: string;
  clientName: string;
  status: InvoiceStatus;
  statusLabel: string;
  statusClass: string;
  totalDisplay: string;
  dueDateDisplay: string;
  sentAtDisplay: string;
  sentAtFullDisplay: string;
}

export type InvoicePageResult = PagedResult<InvoiceListItemDto>;

export type InvoiceListSortBy = 'created' | 'invoice' | 'client' | 'status' | 'due' | 'sent' | 'total';
export type InvoiceListSortDirection = 'asc' | 'desc';

export type InvoiceTableAction = 'send' | 'resend' | 'markPaid' | 'downloadPdf' | 'cancel';

export interface InvoiceTableActionEvent {
  action: InvoiceTableAction;
  invoice: InvoiceListItemView;
}
