import { NotificationDto, NotificationListItemView } from '../models/notification.models';

export function toNotificationView(
  notification: NotificationDto,
  translate: (key: string, parameters?: Record<string, string | number>) => string,
  locale = 'en',
): NotificationListItemView {
  return {
    id: notification.id,
    title: notification.title,
    message: notification.message,
    type: notification.type,
    typeLabel: translateLabel(translate, 'notificationTypes', notification.type),
    priority: notification.priority,
    priorityLabel: translateLabel(translate, 'notificationPriorities', notification.priority),
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    createdAtDisplay: formatNotificationDate(notification.createdAt, locale),
    relativeTime: formatRelativeTime(notification.createdAt, locale),
    actionUrl: notification.actionUrl,
  };
}

export function notificationPriorityClass(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'high':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'medium':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    default:
      return 'border-neutral-200 bg-neutral-50 text-neutral-600';
  }
}

export function notificationTypeClass(type: string): string {
  switch (type) {
    case 'invoice':
      return 'bg-blue-50 text-blue-700';
    case 'payment':
      return 'bg-emerald-50 text-emerald-700';
    case 'client':
      return 'bg-sky-50 text-sky-700';
    case 'subscription':
      return 'bg-violet-50 text-violet-700';
    case 'security':
      return 'bg-red-50 text-red-700';
    case 'user_management':
      return 'bg-amber-50 text-amber-700';
    default:
      return 'bg-neutral-100 text-neutral-700';
  }
}

function translateLabel(
  translate: (key: string, parameters?: Record<string, string | number>) => string,
  namespace: string,
  value: string,
): string {
  const key = `${namespace}.${value}`;
  const translated = translate(key);

  return translated === key ? formatLabel(value) : translated;
}

function formatNotificationDate(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function formatRelativeTime(value: string, locale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(diffSeconds);
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (absoluteSeconds < 60) {
    return formatter.format(diffSeconds, 'second');
  }

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

function formatLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
