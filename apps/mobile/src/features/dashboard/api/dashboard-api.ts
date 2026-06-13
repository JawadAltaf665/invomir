import { apiRequest } from '@/src/services/api/api-client';
import { DashboardActionItemsDto, DashboardDto } from '@/src/features/dashboard/types';

export const dashboardApi = {
  getDashboard(): Promise<DashboardDto> {
    return apiRequest<DashboardDto>({
      method: 'GET',
      url: '/api/dashboard',
    });
  },

  getActionItems(): Promise<DashboardActionItemsDto> {
    return apiRequest<DashboardActionItemsDto>({
      method: 'GET',
      url: '/api/dashboard/action-items',
    });
  },
};
