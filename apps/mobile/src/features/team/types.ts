export type TeamRole = 'owner' | 'admin' | 'member';
export type TeamInvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface TeamMemberDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: TeamRole | string;
  plan: string;
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
