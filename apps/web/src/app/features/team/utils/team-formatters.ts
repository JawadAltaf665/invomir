import {
  TeamBadgeTone,
  TeamInvitationDto,
  TeamInvitationStatus,
  TeamInvitationView,
  TeamMemberDto,
  TeamMemberView,
  TeamRole,
} from '../models/team.models';

const businessSeatLimit = 3;

export function toTeamMemberView(member: TeamMemberDto): TeamMemberView {
  const fullName = `${member.firstName} ${member.lastName}`.trim() || member.email;
  const role = normalizeRole(member.role);

  return {
    ...member,
    fullName,
    initials: buildInitials(member.firstName, member.lastName, member.email),
    roleLabel: formatRole(member.role),
    roleTone: roleTone(role),
    planLabel: formatPlan(member.plan),
    statusLabel: member.isActive ? 'Active' : 'Inactive',
    statusTone: member.isActive ? 'success' : 'neutral',
    emailStatusLabel: member.emailVerified ? 'Verified' : 'Pending',
    emailStatusTone: member.emailVerified ? 'success' : 'warning',
    lastLoginDisplay: member.lastLoginAt ? formatDateTime(member.lastLoginAt) : 'Not set',
    createdAtDisplay: formatDateTime(member.createdAt),
    canRemove: role !== 'owner' && member.role !== 'system_admin',
    canChangeRole: member.role !== 'system_admin',
  };
}

export function toTeamInvitationView(invitation: TeamInvitationDto): TeamInvitationView {
  const status = normalizeInvitationStatus(invitation.status);

  return {
    ...invitation,
    roleLabel: formatRole(invitation.role),
    roleTone: roleTone(normalizeRole(invitation.role)),
    statusLabel: formatInvitationStatus(invitation.status),
    statusTone: invitationStatusTone(status),
    expiresAtDisplay: formatDateTime(invitation.expiresAt),
    createdAtDisplay: formatDateTime(invitation.createdAt),
  };
}

export function formatRole(role: string): string {
  const normalizedRole = role.trim().toLowerCase();

  return normalizedRole
    .split('_')
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function formatPlan(plan: string): string {
  return `${plan.charAt(0).toUpperCase()}${plan.slice(1)}`;
}

export function formatInvitationStatus(status: string): string {
  return formatRole(status);
}

export function buildSeatUsage(
  members: readonly TeamMemberDto[],
  invitations: readonly TeamInvitationDto[],
): {
  activeMembers: number;
  pendingInvitations: number;
  usedSeats: number;
  limit: number;
  remaining: number;
} {
  const activeMembers = members.filter((member) => member.isActive).length;
  const pendingInvitations = invitations.filter(
    (invitation) => normalizeInvitationStatus(invitation.status) === 'pending',
  ).length;
  const usedSeats = activeMembers + pendingInvitations;

  return {
    activeMembers,
    pendingInvitations,
    usedSeats,
    limit: businessSeatLimit,
    remaining: Math.max(0, businessSeatLimit - usedSeats),
  };
}

export function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function buildInitials(firstName: string, lastName: string, email: string): string {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim();

  return (initials || email.charAt(0) || 'U').toUpperCase();
}

function normalizeRole(role: string): TeamRole | string {
  return role.trim().toLowerCase();
}

function normalizeInvitationStatus(status: string): TeamInvitationStatus | string {
  return status.trim().toLowerCase();
}

function roleTone(role: TeamRole | string): TeamBadgeTone {
  if (role === 'owner') {
    return 'success';
  }

  if (role === 'admin') {
    return 'info';
  }

  return 'neutral';
}

function invitationStatusTone(status: TeamInvitationStatus | string): TeamBadgeTone {
  if (status === 'pending') {
    return 'warning';
  }

  if (status === 'accepted') {
    return 'success';
  }

  if (status === 'cancelled' || status === 'expired') {
    return 'danger';
  }

  return 'neutral';
}
