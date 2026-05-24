export const auditEntityFilters = ['all', 'Invoice', 'Client', 'User', 'TeamInvitation'] as const;
export const auditActionFilters = [
  'all',
  'created',
  'updated',
  'deleted',
  'cancelled',
  'duplicated',
  'sent',
  'resent',
  'viewed',
  'paid',
  'reminders_updated',
  'login',
  'token_refreshed',
  'logout',
  'email_verified',
  'password_reset_requested',
  'password_reset',
  'password_changed',
  'stripe_connect_started',
  'stripe_connect_completed',
  'subscription_checkout_started',
  'subscription_cancelled',
  'subscription_synced',
  'plan_overridden',
  'trial_extended',
  'team_invited',
  'team_invitation_cancelled',
  'team_invitation_accepted',
  'team_member_removed',
  'team_member_role_changed',
] as const;

export type AuditEntityFilter = (typeof auditEntityFilters)[number];
export type AuditActionFilter = (typeof auditActionFilters)[number];

export interface AuditLogDto {
  id: string;
  tenantId: string | null;
  tenantName: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  entityName: string;
  entityId: string | null;
  entityDisplayName: string | null;
  action: string;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogListQuery {
  entityName: AuditEntityFilter | string;
  entityId: string;
  action: AuditActionFilter | string;
  from: string;
  to: string;
  searchTerm: string;
  page: number;
  limit: number;
}

export type AuditLogListFilters = AuditLogListQuery;

export interface AuditLogListItemView {
  id: string;
  actorName: string;
  actorMeta: string;
  workspaceName: string;
  workspaceMeta: string;
  entityName: string;
  entityLabel: string;
  entityMeta: string;
  entityId: string | null;
  entityLink: string[] | null;
  action: string;
  actionLabel: string;
  actionTone: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  summary: string;
  createdAtDisplay: string;
  createdAtRelative: string;
  ipAddressDisplay: string;
  userAgentDisplay: string;
  oldValuesDisplay: string;
  newValuesDisplay: string;
}
