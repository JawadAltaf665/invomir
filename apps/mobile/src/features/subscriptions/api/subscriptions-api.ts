import { apiRequest } from '@/src/services/api/api-client';
import { CurrentSubscriptionDto } from '@/src/features/subscriptions/types';

export const subscriptionsApi = {
  getCurrentSubscription(): Promise<CurrentSubscriptionDto> {
    return apiRequest<CurrentSubscriptionDto>({
      method: 'GET',
      url: '/api/subscriptions',
    });
  },
};
