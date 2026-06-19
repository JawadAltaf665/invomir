export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  target: string;
  userId: string;
  roleId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  createdBy: string | null;
  actionUrl: string | null;
  metadata: unknown;
}

export interface UnreadNotificationCountDto {
  count: number;
}

export interface NotificationListQuery {
  type?: string | null;
  status?: string | null;
  priority?: string | null;
  search?: string | null;
  page: number;
  limit: number;
}
