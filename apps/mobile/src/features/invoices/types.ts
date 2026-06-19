export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
export type InvoicePaymentTerms = 'due_on_receipt' | 'net_7' | 'net_14' | 'net_30';
export type InvoiceDiscountType = 'fixed' | 'percent';
export type InvoicePaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'other';
export type InvoiceListSortBy = 'created' | 'invoice' | 'client' | 'status' | 'due' | 'sent' | 'total';
export type InvoiceListSortDirection = 'asc' | 'desc';

export const invoiceStatuses = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'] as const;
export const invoicePaymentTerms = ['due_on_receipt', 'net_7', 'net_14', 'net_30'] as const;

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

export interface InvoiceDuplicateRequest {
  clientId?: string | null;
  dueDate?: string | null;
}

export interface InvoiceCancellationDto {
  id: string;
  status: InvoiceStatus;
  cancelledAt: string | null;
}

export interface InvoicePdfResult {
  fileName: string;
  contentType: string;
  uri?: string;
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
