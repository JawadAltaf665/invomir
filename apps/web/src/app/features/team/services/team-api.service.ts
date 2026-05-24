import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AcceptTeamInvitationRequest,
  ChangeTeamMemberRoleRequest,
  InviteTeamMemberRequest,
  TeamInvitationAcceptedDto,
  TeamInvitationDto,
  TeamMemberDto,
  TeamMemberRoleUpdateDto,
} from '../models/team.models';

@Injectable({ providedIn: 'root' })
export class TeamApiService {
  private readonly http = inject(HttpClient);

  listMembers(): Observable<ApiResponse<readonly TeamMemberDto[]>> {
    return this.http.get<ApiResponse<readonly TeamMemberDto[]>>(apiUrl('/api/team/members'));
  }

  listInvitations(): Observable<ApiResponse<readonly TeamInvitationDto[]>> {
    return this.http.get<ApiResponse<readonly TeamInvitationDto[]>>(
      apiUrl('/api/team/invitations'),
    );
  }

  inviteMember(request: InviteTeamMemberRequest): Observable<ApiResponse<TeamInvitationDto>> {
    return this.http.post<ApiResponse<TeamInvitationDto>>(
      apiUrl('/api/team/invitations'),
      request,
    );
  }

  cancelInvitation(id: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/team/invitations/${encodeURIComponent(id)}`));
  }

  removeMember(id: string): Observable<void> {
    return this.http.delete<void>(apiUrl(`/api/team/members/${encodeURIComponent(id)}`));
  }

  changeMemberRole(
    id: string,
    request: ChangeTeamMemberRoleRequest,
  ): Observable<ApiResponse<TeamMemberRoleUpdateDto>> {
    return this.http.patch<ApiResponse<TeamMemberRoleUpdateDto>>(
      apiUrl(`/api/team/members/${encodeURIComponent(id)}/role`),
      request,
    );
  }

  acceptInvitation(
    token: string,
    request: AcceptTeamInvitationRequest,
  ): Observable<ApiResponse<TeamInvitationAcceptedDto>> {
    return this.http.post<ApiResponse<TeamInvitationAcceptedDto>>(
      apiUrl(`/api/team/invitations/${encodeURIComponent(token)}/accept`),
      request,
      {
        withCredentials: true,
      },
    );
  }
}
