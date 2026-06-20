import { PagedResult } from '../../../core/models/api-response.model';

export const emailTemplateTypes = [
  'InvoiceCreated',
  'InvoiceSent',
  'InvoiceViewed',
  'InvoicePaid',
  'InvoiceOverdue',
  'PaymentReminder',
  'WelcomeEmail',
  'EmailVerification',
  'PasswordReset',
  'SubscriptionStarted',
  'SubscriptionRenewed',
  'SubscriptionCancelled',
  'TrialExpiryReminder',
  'TeamMemberInvitation',
] as const;

export const queuedEmailStatuses = [
  'Pending',
  'Processing',
  'Sent',
  'Failed',
  'Cancelled',
] as const;

export type EmailTemplateType = (typeof emailTemplateTypes)[number];
export type QueuedEmailStatus = (typeof queuedEmailStatuses)[number];

export interface EmailTemplateDto {
  id: string;
  templateType: EmailTemplateType;
  templateTypeName: string;
  name: string;
  subject: string;
  body: string;
  language: string;
  isActive: boolean;
  isSystemTemplate: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface EmailTemplateRequest {
  templateType: EmailTemplateType;
  name: string;
  subject: string;
  body: string;
  language: string;
  isActive: boolean;
  isSystemTemplate?: boolean;
}

export interface EmailTemplatePreviewRequest {
  templateType?: EmailTemplateType;
  language?: string;
  subject?: string;
  body?: string;
  tokens: Record<string, string>;
}

export interface EmailTemplatePreviewDto {
  subject: string;
  body: string;
}

export interface EmailTemplateListQuery {
  templateType?: EmailTemplateType | '';
  language?: string;
  isActive?: boolean | '';
  search?: string;
  page: number;
  limit: number;
}

export interface QueuedEmailDto {
  id: string;
  tenantId: string | null;
  templateType: EmailTemplateType | null;
  templateTypeName: string | null;
  toEmail: string;
  toName: string | null;
  cc: string | null;
  bcc: string | null;
  subject: string;
  body: string;
  status: QueuedEmailStatus;
  statusName: string;
  retryCount: number;
  maxRetryCount: number;
  errorMessage: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  lastAttemptAt: string | null;
  hasAttachment: boolean;
  attachmentFileName: string | null;
}

export interface QueuedEmailListQuery {
  status?: QueuedEmailStatus | '';
  tenantId?: string;
  templateType?: EmailTemplateType | '';
  from?: string;
  to?: string;
  searchEmail?: string;
  page: number;
  limit: number;
}

export type EmailTemplatePageResult = PagedResult<EmailTemplateDto>;
export type QueuedEmailPageResult = PagedResult<QueuedEmailDto>;
