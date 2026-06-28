export const paymentStatuses = ['all', 'completed', 'failed', 'refunded'] as const;

export type PaymentStatusFilter = (typeof paymentStatuses)[number];
export type PaymentStatus = Exclude<PaymentStatusFilter, 'all'>;

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
  status: PaymentStatus | string;
  paidAt: string;
  stripeChargeId: string | null;
  stripePaymentIntentId: string | null;
  note: string | null;
}

export interface PaymentListQuery {
  status: PaymentStatusFilter;
  page: number;
  limit: number;
}

export interface PaymentListFilters extends PaymentListQuery {
  searchTerm: string;
}

export type PaymentPageResult = PaymentHistoryDto;

export interface PaymentListItemView {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  amountDisplay: string;
  methodLabel: string;
  status: PaymentStatus | string;
  statusLabel: string;
  statusClass: string;
  paidAtDisplay: string;
  gatewayReferenceDisplay: string;
  noteDisplay: string;
}

export interface StripeConnectUrlDto {
  oauthUrl: string;
  state: string;
}

export interface StripeConnectStatusDto {
  isConnected: boolean;
  accountId: string | null;
  connectedAt: string | null;
}

export interface StripeDisconnectResultDto {
  message: string;
}
