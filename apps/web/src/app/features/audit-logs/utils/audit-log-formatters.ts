import { AuditLogDto, AuditLogListItemView } from '../models/audit-log.models';

const entityLabels: Record<string, string> = {
  invoice: 'Invoice',
  client: 'Client',
  user: 'User',
  teaminvitation: 'Team invitation',
};

const actionToneMap: Record<string, AuditLogListItemView['actionTone']> = {
  created: 'success',
  updated: 'info',
  deleted: 'danger',
  cancelled: 'warning',
  duplicated: 'info',
  sent: 'success',
  resent: 'info',
  viewed: 'neutral',
  paid: 'success',
  reminders_updated: 'info',
  login: 'success',
  token_refreshed: 'neutral',
  logout: 'neutral',
  email_verified: 'success',
  password_reset_requested: 'warning',
  password_reset: 'warning',
  password_changed: 'warning',
  stripe_connect_started: 'info',
  stripe_connect_completed: 'success',
  subscription_checkout_started: 'info',
  subscription_cancelled: 'warning',
  subscription_synced: 'info',
  plan_overridden: 'warning',
  trial_extended: 'success',
  team_invited: 'success',
  team_invitation_cancelled: 'warning',
  team_invitation_accepted: 'success',
  team_member_removed: 'danger',
  team_member_role_changed: 'info',
};

export function toAuditLogView(log: AuditLogDto): AuditLogListItemView {
  const entityName = formatEntityLabel(log.entityName);
  const actionLabel = formatAuditLabel(log.action);
  const actorName = log.userName?.trim() || log.userEmail?.trim() || 'System';

  return {
    id: log.id,
    actorName,
    actorMeta: log.userEmail?.trim() || log.userId || 'Automated event',
    workspaceName: log.tenantName?.trim() || 'Workspace',
    workspaceMeta: log.tenantId || 'No tenant recorded',
    entityName,
    entityLabel: formatEntityReference(log),
    entityMeta: formatEntityMeta(log),
    entityId: log.entityId,
    entityLink: buildEntityLink(log.entityName, log.entityId),
    action: log.action,
    actionLabel,
    actionTone: actionToneMap[log.action.toLowerCase()] ?? 'neutral',
    summary: buildAuditSummary(log),
    createdAtDisplay: formatAuditDateTime(log.createdAt),
    createdAtRelative: formatRelativeTime(log.createdAt),
    ipAddressDisplay: formatIpAddress(log.ipAddress),
    userAgentDisplay: formatUserAgent(log.userAgent),
    oldValuesDisplay: formatAuditValue(log.oldValues),
    newValuesDisplay: formatAuditValue(log.newValues),
  };
}

export function formatAuditLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Not set';
  }

  return value
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatEntityLabel(entityName: string): string {
  const normalized = entityName.trim().toLowerCase();
  return entityLabels[normalized] ?? formatAuditLabel(entityName);
}

export function formatAuditDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatRelativeTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(diffSeconds);
  const units: readonly [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31_536_000],
    ['month', 2_592_000],
    ['day', 86_400],
    ['hour', 3_600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

  for (const [unit, secondsPerUnit] of units) {
    if (absoluteSeconds >= secondsPerUnit) {
      return formatter.format(Math.round(diffSeconds / secondsPerUnit), unit);
    }
  }

  return formatter.format(diffSeconds, 'second');
}

export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return 'No values recorded';
  }

  if (typeof value === 'string') {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return 'Values could not be displayed';
  }
}

function buildEntityLink(entityName: string, entityId: string | null): string[] | null {
  if (!entityId) {
    return null;
  }

  const normalized = entityName.trim().toLowerCase();

  if (normalized === 'invoice') {
    return ['/app/invoices', entityId];
  }

  if (normalized === 'client') {
    return ['/app/clients', entityId];
  }

  return null;
}

function formatEntityReference(log: AuditLogDto): string {
  const label = formatEntityLabel(log.entityName);
  const displayName = log.entityDisplayName?.trim();

  if (displayName) {
    return `${label} ${displayName}`;
  }

  if (!log.entityId) {
    return label;
  }

  return label;
}

function formatEntityMeta(log: AuditLogDto): string {
  if (!log.entityId) {
    return 'No entity id recorded';
  }

  return `ID ${log.entityId}`;
}

function buildAuditSummary(log: AuditLogDto): string {
  const actionLabel = formatAuditLabel(log.action).toLowerCase();
  const entityLabel = formatEntityLabel(log.entityName).toLowerCase();
  const changedFields = countChangedFields(log.oldValues, log.newValues);

  if (changedFields > 0) {
    return `${actionLabel} ${entityLabel}; ${changedFields} field${changedFields === 1 ? '' : 's'} recorded`;
  }

  return `${actionLabel} ${entityLabel}`;
}

function countChangedFields(oldValues: unknown, newValues: unknown): number {
  const keys = new Set<string>();

  collectObjectKeys(oldValues).forEach((key) => keys.add(key));
  collectObjectKeys(newValues).forEach((key) => keys.add(key));

  return keys.size;
}

function collectObjectKeys(value: unknown): readonly string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }

  return Object.keys(value);
}

function formatIpAddress(value: string | null): string {
  const normalized = value?.trim();

  if (!normalized) {
    return 'Not captured';
  }

  return normalized === '::1' || normalized === '127.0.0.1' ? 'Local development' : normalized;
}

function formatUserAgent(value: string | null): string {
  if (!value?.trim()) {
    return 'Not captured';
  }

  const userAgent = value.trim();

  if (!userAgent.includes('Mozilla/')) {
    return userAgent;
  }

  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('Chrome/')
      ? 'Chrome'
      : userAgent.includes('Firefox/')
        ? 'Firefox'
        : userAgent.includes('Safari/')
          ? 'Safari'
          : 'Browser';
  const platform = userAgent.includes('Windows')
    ? 'Windows'
    : userAgent.includes('Mac OS X')
      ? 'macOS'
      : userAgent.includes('iPhone')
        ? 'iPhone'
        : userAgent.includes('Android')
          ? 'Android'
          : userAgent.includes('Linux')
            ? 'Linux'
            : 'Unknown device';

  return `${browser} - ${platform}`;
}
