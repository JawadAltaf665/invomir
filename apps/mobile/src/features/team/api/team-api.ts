import { apiRequest, apiRequestVoid } from '@/src/services/api/api-client';
import {
  InviteTeamMemberRequest,
  TeamInvitationDto,
  TeamMemberDto,
} from '@/src/features/team/types';

export const teamApi = {
  listMembers(): Promise<readonly TeamMemberDto[]> {
    return apiRequest<readonly TeamMemberDto[]>({
      method: 'GET',
      url: '/api/team/members',
    });
  },

  listInvitations(): Promise<readonly TeamInvitationDto[]> {
    return apiRequest<readonly TeamInvitationDto[]>({
      method: 'GET',
      url: '/api/team/invitations',
    });
  },

  inviteMember(request: InviteTeamMemberRequest): Promise<TeamInvitationDto> {
    return apiRequest<TeamInvitationDto>({
      method: 'POST',
      url: '/api/team/invitations',
      data: request,
    });
  },

  removeMember(id: string): Promise<void> {
    return apiRequestVoid({
      method: 'DELETE',
      url: `/api/team/members/${encodeURIComponent(id)}`,
    });
  },

  cancelInvitation(id: string): Promise<void> {
    return apiRequestVoid({
      method: 'DELETE',
      url: `/api/team/invitations/${encodeURIComponent(id)}`,
    });
  },
};
