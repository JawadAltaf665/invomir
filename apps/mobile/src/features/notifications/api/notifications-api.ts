import {
  NotificationDto,
  NotificationListQuery,
  UnreadNotificationCountDto,
} from '@/src/features/notifications/types';
import { apiRequest } from '@/src/services/api/api-client';
import { PagedResult } from '@/src/types/api';

export const notificationsApi = {
  listNotifications(query: NotificationListQuery): Promise<PagedResult<NotificationDto>> {
    return apiRequest<PagedResult<NotificationDto>>({
      method: 'GET',
      url: '/api/notifications',
      params: {
        type: query.type ?? undefined,
        status: query.status ?? undefined,
        priority: query.priority ?? undefined,
        q: query.search?.trim() || undefined,
        page: query.page,
        limit: query.limit,
      },
    });
  },

  getUnreadCount(): Promise<UnreadNotificationCountDto> {
    return apiRequest<UnreadNotificationCountDto>({
      method: 'GET',
      url: '/api/notifications/unread-count',
    });
  },

  markRead(id: string): Promise<NotificationDto> {
    return apiRequest<NotificationDto>({
      method: 'PUT',
      url: `/api/notifications/${id}/read`,
    });
  },

  markAllRead(): Promise<number> {
    return apiRequest<number>({
      method: 'PUT',
      url: '/api/notifications/read-all',
    });
  },
};
