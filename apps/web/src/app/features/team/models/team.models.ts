import { SubscriptionPlan, UserRole } from '../../../core/auth/auth.models';

export type TeamRole = 'owner' | 'admin' | 'member';
export type TeamInvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';
export type TeamBadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export const teamRoleOptions: readonly TeamRole[] = ['member', 'admin', 'owner'];

export interface TeamMemberDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TeamRole | UserRole | string;
  plan: SubscriptionPlan | string;
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface TeamInvitationDto {
  id: string;
  invitedByUserId: string;
  invitedByName: string;
  email: string;
  role: TeamRole | string;
  status: TeamInvitationStatus | string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface InviteTeamMemberRequest {
  email: string;
  role: TeamRole;
}

export interface ChangeTeamMemberRoleRequest {
  role: TeamRole;
}

export interface AcceptTeamInvitationRequest {
  firstName: string;
  lastName: string;
  password: string;
}

export interface TeamInvitationAcceptedDto {
  userId: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TeamRole | string;
}

export interface TeamMemberRoleUpdateDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TeamRole | string;
}

export interface TeamMemberView extends TeamMemberDto {
  fullName: string;
  initials: string;
  roleLabel: string;
  roleTone: TeamBadgeTone;
  planLabel: string;
  statusLabel: string;
  statusTone: TeamBadgeTone;
  emailStatusLabel: string;
  emailStatusTone: TeamBadgeTone;
  lastLoginDisplay: string;
  createdAtDisplay: string;
  canRemove: boolean;
  canChangeRole: boolean;
}

export interface TeamInvitationView extends TeamInvitationDto {
  roleLabel: string;
  roleTone: TeamBadgeTone;
  statusLabel: string;
  statusTone: TeamBadgeTone;
  expiresAtDisplay: string;
  createdAtDisplay: string;
}

export interface TeamSeatUsageView {
  activeMembers: number;
  pendingInvitations: number;
  usedSeats: number;
  limit: number;
  remaining: number;
}
