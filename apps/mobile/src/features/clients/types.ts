import { PagedResult } from '@/src/types/api';

export interface ClientListItemDto {
  id: string;
  name: string;
  email: string;
  company: string | null;
  totalRevenue: number;
  currency: string;
  invoiceCount: number;
  draftInvoiceCount: number;
  sentInvoiceCount: number;
  viewedInvoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;
  cancelledInvoiceCount: number;
  lastInvoiceAt: string | null;
}

export interface ClientDto {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  company: string | null;
  taxId: string | null;
  notes: string | null;
  isActive: boolean;
}

export interface ClientInvoiceSummaryDto {
  id: string;
  invoiceNumber: string;
  status: string;
  total: number;
  currency: string;
  dueDate: string;
}

export interface ClientDetailDto extends ClientDto {
  totalRevenue: number;
  currency: string;
  invoices: PagedResult<ClientInvoiceSummaryDto>;
}

export interface ClientSaveRequest {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  company?: string | null;
  taxId?: string | null;
  notes?: string | null;
}

export interface ClientListQuery {
  q?: string | null;
  page: number;
  limit: number;
}
