export interface PaymentHistoryDto {
  items: readonly PaymentHistoryItemDto[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PaymentHistoryItemDto {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  paidAt: string;
  stripeChargeId: string | null;
  stripePaymentIntentId: string | null;
  note: string | null;
}

export interface PaymentListQuery {
  status?: string | null;
  page: number;
  limit: number;
}
