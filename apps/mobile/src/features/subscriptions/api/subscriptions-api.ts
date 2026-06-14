import { apiRequest } from '@/src/services/api/api-client';
import {
  CurrentSubscriptionDto,
  SubscriptionCancellationDto,
  SubscriptionCheckoutDto,
  SubscriptionCheckoutRequest,
  SubscriptionPlansDto,
} from '@/src/features/subscriptions/types';

export const subscriptionsApi = {
  getCurrentSubscription(): Promise<CurrentSubscriptionDto> {
    return apiRequest<CurrentSubscriptionDto>({
      method: 'GET',
      url: '/api/subscriptions',
    });
  },

  getPlans(): Promise<SubscriptionPlansDto> {
    return apiRequest<SubscriptionPlansDto>({
      method: 'GET',
      url: '/api/subscriptions/plans',
    });
  },

  createCheckout(request: SubscriptionCheckoutRequest): Promise<SubscriptionCheckoutDto> {
    return apiRequest<SubscriptionCheckoutDto>({
      method: 'POST',
      url: '/api/subscriptions/checkout',
      data: request,
    });
  },

  cancelSubscription(): Promise<SubscriptionCancellationDto> {
    return apiRequest<SubscriptionCancellationDto>({
      method: 'POST',
      url: '/api/subscriptions/cancel',
      data: {},
    });
  },
};
