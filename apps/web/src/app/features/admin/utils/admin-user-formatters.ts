import { Permission, permissions } from '../../../core/permissions/permissions';
import {
  AdminBadgeTone,
  AdminPermissionGroupView,
  AdminPlan,
  AdminRole,
  AdminUserListItemDto,
  AdminUserListItemView,
  adminRoles,
} from '../models/admin-user.models';

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const organizationPermissions = [
  permissions.dashboard.view,
  ...Object.values(permissions.invoice),
  ...Object.values(permissions.client),
  ...Object.values(permissions.payment),
  ...Object.values(permissions.report),
  permissions.notification.view,
  ...Object.values(permissions.subscription),
  permissions.team.manage,
  permissions.settings.manage,
] as const;

const systemPermissions = [
  permissions.auditLog.view,
  permissions.system.access,
  permissions.system.users.view,
  permissions.system.users.manage,
] as const;

const allPermissions = [...organizationPermissions, ...systemPermissions] as const;

export function toAdminUserListItemView(user: AdminUserListItemDto): AdminUserListItemView {
  return {
    id: user.id,
    tenantId: user.tenantId,
    fullName: formatAdminUserName(user.firstName, user.lastName, user.email),
    initials: formatInitials(user.firstName, user.lastName, user.email),
    email: user.email,
    tenantName: user.tenantName,
    role: user.role,
    roleLabel: formatRoleLabel(user.role),
    rolePermissionCount: getPermissionsForRole(user.role).length,
    plan: user.plan,
    planLabel: formatPlanLabel(user.plan),
    statusLabel: user.isActive ? 'Active' : 'Inactive',
    statusTone: user.isActive ? 'success' : 'danger',
    emailStatusLabel: user.emailVerified ? 'Verified' : 'Pending',
    emailStatusTone: user.emailVerified ? 'success' : 'warning',
    trialStatusLabel: user.isTrialActive ? 'Trial active' : 'No active trial',
    trialStatusTone: user.isTrialActive ? 'info' : 'neutral',
    trialEndsDisplay: formatTrialEnds(user.trialEndsAt),
    lastLoginDisplay: formatNullableDateTime(user.lastLoginAt),
    createdAtDisplay: formatNullableDateTime(user.createdAt),
    invoiceCountDisplay: integerFormatter.format(user.invoiceCount),
    paidInvoiceCountDisplay: integerFormatter.format(user.paidInvoiceCount),
    totalRevenueDisplay: formatAdminAmount(user.totalRevenue),
    stripeCustomerDisplay: user.stripeCustomerId?.trim() || 'Not connected',
  };
}

export function formatAdminUserName(firstName: string, lastName: string, email: string): string {
  const fullName = [firstName, lastName]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ');

  return fullName || email;
}

export function formatInitials(firstName: string, lastName: string, email: string): string {
  const source = [firstName, lastName].filter(Boolean).join(' ') || email;
  const initials = source
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'IM';
}

export function formatPlanLabel(plan: string): string {
  return toTitleCase(plan || 'free');
}

export function formatRoleLabel(role: string): string {
  if (role.trim().toLowerCase() === 'system_admin') {
    return 'Super Admin';
  }

  return toTitleCase(role.replaceAll('_', ' '));
}

export function formatPermissionLabel(permission: string): string {
  return toTitleCase(permission.replaceAll('.', ' ').replaceAll('_', ' '));
}

export function formatStatusLabel(status: string): string {
  return toTitleCase(status.replaceAll('_', ' '));
}

export function formatNullableDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? 'Not set' : dateTimeFormatter.format(date);
}

export function formatNullableDate(value: string | null | undefined): string {
  if (!value) {
    return 'Not set';
  }

  const date = parseDate(value);

  return Number.isNaN(date.getTime()) ? 'Not set' : dateFormatter.format(date);
}

export function formatTrialEnds(value: string | null | undefined): string {
  if (!value) {
    return 'No trial end';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'No trial end';
  }

  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / 86_400_000);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} left`;
  }

  return `Ended ${dateFormatter.format(date)}`;
}

export function formatAdminAmount(amount: number | null | undefined): string {
  return numberFormatter.format(Number(amount ?? 0));
}

export function formatCurrencyAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${formatAdminAmount(amount)}`;
  }
}

export function getPermissionsForRole(role: string): readonly Permission[] {
  switch (role.trim().toLowerCase()) {
    case 'system_admin':
      return allPermissions;
    case 'owner':
      return organizationPermissions;
    case 'admin':
      return [
        permissions.dashboard.view,
        ...Object.values(permissions.invoice),
        ...Object.values(permissions.client),
        ...Object.values(permissions.payment),
        ...Object.values(permissions.report),
        permissions.notification.view,
        permissions.subscription.view,
        permissions.team.manage,
        permissions.settings.manage,
      ];
    case 'accountant':
      return [
        permissions.dashboard.view,
        permissions.invoice.view,
        permissions.invoice.create,
        permissions.invoice.update,
        permissions.invoice.send,
        permissions.invoice.markPaid,
        permissions.invoice.manageReminders,
        permissions.client.view,
        permissions.payment.view,
        permissions.payment.manage,
        ...Object.values(permissions.report),
        permissions.notification.view,
        permissions.subscription.view,
      ];
    case 'member':
      return [
        permissions.dashboard.view,
        permissions.invoice.view,
        permissions.invoice.create,
        permissions.invoice.update,
        permissions.invoice.send,
        permissions.invoice.duplicate,
        permissions.client.view,
        permissions.client.create,
        permissions.client.update,
        permissions.payment.view,
        permissions.report.view,
        permissions.notification.view,
        permissions.subscription.view,
      ];
    case 'viewer':
      return [
        permissions.dashboard.view,
        permissions.invoice.view,
        permissions.client.view,
        permissions.payment.view,
        permissions.report.view,
        permissions.notification.view,
        permissions.subscription.view,
      ];
    default:
      return [];
  }
}

export function getPermissionGroupsForRole(role: string): readonly AdminPermissionGroupView[] {
  const rolePermissions = new Set(getPermissionsForRole(role));

  return [
    {
      label: 'Workspace',
      permissions: organizationPermissions.filter((permission) => rolePermissions.has(permission)),
    },
    {
      label: 'System',
      permissions: systemPermissions.filter((permission) => rolePermissions.has(permission)),
    },
  ].filter((group) => group.permissions.length > 0);
}

export function adminBadgeClass(tone: AdminBadgeTone): string {
  const baseClass =
    'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1';

  const toneClass: Record<AdminBadgeTone, string> = {
    neutral: 'bg-neutral-50 text-neutral-700 ring-neutral-200',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-700 ring-amber-200',
    danger: 'bg-red-50 text-red-700 ring-red-200',
    info: 'bg-primary/10 text-primary ring-primary/20',
  };

  return `${baseClass} ${toneClass[tone]}`;
}

export function normalizeAdminPlan(plan: string): AdminPlan {
  const normalizedPlan = plan.trim().toLowerCase();

  return ['free', 'starter', 'professional', 'business'].includes(normalizedPlan)
    ? (normalizedPlan as AdminPlan)
    : 'free';
}

export function normalizeAdminRole(role: string): AdminRole {
  const normalizedRole = role.trim().toLowerCase();

  return adminRoles.includes(normalizedRole as AdminRole)
    ? (normalizedRole as AdminRole)
    : 'viewer';
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
}

export function toTrialEndIso(value: string): string {
  return new Date(`${value}T23:59:59.000Z`).toISOString();
}

export function tomorrowDateInputValue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  return date.toISOString().slice(0, 10);
}

function parseDate(value: string): Date {
  return new Date(value.includes('T') ? value : `${value}T00:00:00`);
}

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}
