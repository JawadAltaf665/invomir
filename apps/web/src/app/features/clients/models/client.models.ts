import { PagedResult } from '../../../core/models/api-response.model';

export interface ClientListItemDto {
  id: string;
  name: string;
  email: string;
  company: string | null;
  totalRevenue: number;
  invoiceCount: number;
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
  invoices: PagedResult<ClientInvoiceSummaryDto>;
}

export interface ClientListQuery {
  q: string | null;
  page: number;
  limit: number;
}

export interface ClientListFilters extends ClientListQuery {
  searchTerm: string;
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

export interface ClientListItemView {
  id: string;
  name: string;
  email: string;
  companyDisplay: string;
  totalRevenueDisplay: string;
  invoiceCountDisplay: string;
}

export interface ClientInvoiceSummaryView {
  id: string;
  invoiceNumber: string;
  status: string;
  statusLabel: string;
  statusClass: string;
  totalDisplay: string;
  dueDateDisplay: string;
}

export type ClientPageResult = PagedResult<ClientListItemDto>;
