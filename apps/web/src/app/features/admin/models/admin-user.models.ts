import { PagedResult } from '../../../core/models/api-response.model';

export const adminPlans = ['free', 'starter', 'professional', 'business'] as const;

export type AdminPlan = (typeof adminPlans)[number];
export type AdminBadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export interface AdminUserListItemDto {
  id: string;
  tenantId: string;
  tenantName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  plan: string;
  isTrialActive: boolean;
  trialEndsAt: string | null;
  lastLoginAt: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  invoiceCount: number;
  paidInvoiceCount: number;
  totalRevenue: number;
  stripeCustomerId: string | null;
}

export interface AdminUserDetailDto {
  id: string;
  tenantId: string;
  tenantName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  plan: string;
  isTrialActive: boolean;
  trialEndsAt: string | null;
  lastLoginAt: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  stripeCustomerId: string | null;
  stripeCustomerUrl: string | null;
  stripeAccountId: string | null;
  stats: AdminUserStatsDto;
  invoices: readonly AdminUserInvoiceDto[];
  planHistory: readonly AdminUserPlanHistoryDto[];
}

export interface AdminUserStatsDto {
  invoiceCount: number;
  paidInvoiceCount: number;
  overdueInvoiceCount: number;
  totalRevenue: number;
  outstandingAmount: number;
}

export interface AdminUserInvoiceDto {
  id: string;
  invoiceNumber: string;
  clientName: string;
  status: string;
  total: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminUserPlanHistoryDto {
  source: string;
  plan: string;
  status: string;
  interval: string | null;
  amount: number | null;
  currency: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  changedAt: string;
}

export interface AdminUserPlanUpdateDto {
  id: string;
  tenantId: string;
  plan: string;
  tenantPlan: string;
}

export interface AdminUserTrialUpdateDto {
  id: string;
  tenantId: string;
  trialEndsAt: string;
  tenantTrialEndsAt: string | null;
  isTrialActive: boolean;
}

export interface UpdateAdminUserPlanRequest {
  plan: AdminPlan;
}

export interface UpdateAdminUserTrialRequest {
  trialEndsAt: string;
}

export interface AdminUserListQuery {
  q: string;
  page: number;
  limit: number;
}

export interface AdminUserListFilters extends AdminUserListQuery {}

export interface AdminUserListItemView {
  id: string;
  tenantId: string;
  fullName: string;
  initials: string;
  email: string;
  tenantName: string;
  role: string;
  roleLabel: string;
  rolePermissionCount: number;
  plan: string;
  planLabel: string;
  statusLabel: string;
  statusTone: AdminBadgeTone;
  emailStatusLabel: string;
  emailStatusTone: AdminBadgeTone;
  trialStatusLabel: string;
  trialStatusTone: AdminBadgeTone;
  trialEndsDisplay: string;
  lastLoginDisplay: string;
  createdAtDisplay: string;
  invoiceCountDisplay: string;
  paidInvoiceCountDisplay: string;
  totalRevenueDisplay: string;
  stripeCustomerDisplay: string;
}

export interface AdminPermissionGroupView {
  label: string;
  permissions: readonly string[];
}

export type AdminUserPageResult = PagedResult<AdminUserListItemDto>;
