import { PaymentHistoryDto, PaymentListQuery, StripeConnectUrlDto } from '@/src/features/payments/types';
import { apiRequest } from '@/src/services/api/api-client';

export const paymentsApi = {
  listPayments(query: PaymentListQuery): Promise<PaymentHistoryDto> {
    return apiRequest<PaymentHistoryDto>({
      method: 'GET',
      url: '/api/payments',
      params: {
        status: query.status ?? undefined,
        page: query.page,
        limit: query.limit,
      },
    });
  },

  createStripeConnect(): Promise<StripeConnectUrlDto> {
    return apiRequest<StripeConnectUrlDto>({
      method: 'POST',
      url: '/api/stripe/connect',
      data: {},
    });
  },
};
