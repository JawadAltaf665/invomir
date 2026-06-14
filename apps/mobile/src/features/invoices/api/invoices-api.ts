import { apiRequest } from '@/src/services/api/api-client';
import {
  InvoiceCancellationDto,
  InvoiceDetailDto,
  InvoiceDuplicateRequest,
  InvoiceListItemDto,
  InvoiceListQuery,
  InvoicePaymentDto,
  InvoicePaymentRequest,
  InvoicePdfResult,
  InvoiceSaveRequest,
  InvoiceSendRequest,
  InvoiceSendResultDto,
} from '@/src/features/invoices/types';
import { PagedResult } from '@/src/types/api';

export const invoicesApi = {
  listInvoices(query: InvoiceListQuery): Promise<PagedResult<InvoiceListItemDto>> {
    return apiRequest<PagedResult<InvoiceListItemDto>>({
      method: 'GET',
      url: '/api/invoices',
      params: {
        page: query.page,
        limit: query.limit,
        status: query.status ?? undefined,
        clientId: query.clientId ?? undefined,
        from: query.from ?? undefined,
        to: query.to ?? undefined,
        q: query.searchTerm?.trim() || undefined,
        minAmount: query.minAmount ?? undefined,
        maxAmount: query.maxAmount ?? undefined,
        sortBy: query.sortBy ?? undefined,
        sortDirection: query.sortDirection ?? undefined,
      },
    });
  },

  getInvoice(id: string, useWorkspaceCurrency = true): Promise<InvoiceDetailDto> {
    return apiRequest<InvoiceDetailDto>({
      method: 'GET',
      url: `/api/invoices/${id}`,
      params: {
        useWorkspaceCurrency,
      },
    });
  },

  createInvoice(request: InvoiceSaveRequest): Promise<InvoiceDetailDto> {
    return apiRequest<InvoiceDetailDto>({
      method: 'POST',
      url: '/api/invoices',
      data: request,
    });
  },

  updateInvoice(id: string, request: InvoiceSaveRequest): Promise<InvoiceDetailDto> {
    return apiRequest<InvoiceDetailDto>({
      method: 'PUT',
      url: `/api/invoices/${id}`,
      data: request,
    });
  },

  sendInvoice(id: string, request: InvoiceSendRequest = {}): Promise<InvoiceSendResultDto> {
    return apiRequest<InvoiceSendResultDto>({
      method: 'POST',
      url: `/api/invoices/${id}/send`,
      data: request,
    });
  },

  resendInvoice(id: string, request: InvoiceSendRequest = {}): Promise<InvoiceSendResultDto> {
    return apiRequest<InvoiceSendResultDto>({
      method: 'POST',
      url: `/api/invoices/${id}/resend`,
      data: request,
    });
  },

  markPaid(id: string, request: InvoicePaymentRequest = {}): Promise<InvoicePaymentDto> {
    return apiRequest<InvoicePaymentDto>({
      method: 'POST',
      url: `/api/invoices/${id}/mark-paid`,
      data: request,
    });
  },

  cancelInvoice(id: string): Promise<InvoiceCancellationDto> {
    return apiRequest<InvoiceCancellationDto>({
      method: 'POST',
      url: `/api/invoices/${id}/cancel`,
    });
  },

  deleteInvoice(id: string): Promise<InvoiceCancellationDto> {
    return apiRequest<InvoiceCancellationDto>({
      method: 'DELETE',
      url: `/api/invoices/${id}`,
    });
  },

  duplicateInvoice(id: string, request: InvoiceDuplicateRequest = {}): Promise<InvoiceDetailDto> {
    return apiRequest<InvoiceDetailDto>({
      method: 'POST',
      url: `/api/invoices/${id}/duplicate`,
      data: request,
    });
  },

  async downloadPdf(id: string, preview = false): Promise<InvoicePdfResult> {
    const { downloadInvoicePdf } = await import('@/src/features/invoices/api/invoice-pdf');
    return downloadInvoicePdf(id, preview);
  },
};
