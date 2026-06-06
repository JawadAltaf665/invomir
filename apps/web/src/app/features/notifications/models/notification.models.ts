export type NotificationType =
  | 'all'
  | 'system'
  | 'invoice'
  | 'payment'
  | 'client'
  | 'subscription'
  | 'user_management'
  | 'security'
  | 'reminder';

export type NotificationPriority = 'all' | 'low' | 'medium' | 'high' | 'critical';
export type NotificationStatus = 'all' | 'read' | 'unread';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: Exclude<NotificationType, 'all'> | string;
  priority: Exclude<NotificationPriority, 'all'> | string;
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
  type: NotificationType;
  status: NotificationStatus;
  priority: NotificationPriority;
  searchTerm: string;
  page: number;
  limit: number;
}

export interface NotificationListItemView {
  id: string;
  title: string;
  message: string;
  type: string;
  typeLabel: string;
  priority: string;
  priorityLabel: string;
  isRead: boolean;
  createdAt: string;
  createdAtDisplay: string;
  relativeTime: string;
  actionUrl: string | null;
}

export const notificationTypeOptions: readonly NotificationType[] = [
  'all',
  'system',
  'invoice',
  'payment',
  'client',
  'subscription',
  'user_management',
  'security',
  'reminder',
];

export const notificationPriorityOptions: readonly NotificationPriority[] = [
  'all',
  'low',
  'medium',
  'high',
  'critical',
];

export const notificationStatusOptions: readonly NotificationStatus[] = ['all', 'unread', 'read'];
