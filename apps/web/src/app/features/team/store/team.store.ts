import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, forkJoin, map, tap, throwError } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AcceptTeamInvitationRequest,
  ChangeTeamMemberRoleRequest,
  InviteTeamMemberRequest,
  TeamInvitationAcceptedDto,
  TeamInvitationDto,
  TeamMemberDto,
} from '../models/team.models';
import { TeamApiService } from '../services/team-api.service';
import { buildSeatUsage, toTeamInvitationView, toTeamMemberView } from '../utils/team-formatters';

@Injectable({ providedIn: 'root' })
export class TeamStore {
  private readonly teamApi = inject(TeamApiService);

  private readonly membersSignal = signal<readonly TeamMemberDto[]>([]);
  private readonly invitationsSignal = signal<readonly TeamInvitationDto[]>([]);
  private readonly isLoadingSignal = signal(false);
  private readonly loadErrorMessagesSignal = signal<readonly string[]>([]);

  private readonly isInvitingSignal = signal(false);
  private readonly inviteErrorMessagesSignal = signal<readonly string[]>([]);
  private readonly inviteSuccessMessageSignal = signal('');

  private readonly actionMemberIdSignal = signal<string | null>(null);
  private readonly actionInvitationIdSignal = signal<string | null>(null);
  private readonly actionErrorMessagesSignal = signal<readonly string[]>([]);
  private readonly actionSuccessMessageSignal = signal('');

  private readonly isAcceptingInvitationSignal = signal(false);
  private readonly acceptErrorMessagesSignal = signal<readonly string[]>([]);
  private readonly acceptSuccessMessageSignal = signal('');
  private readonly acceptedInvitationSignal = signal<TeamInvitationAcceptedDto | null>(null);

  readonly members = this.membersSignal.asReadonly();
  readonly invitations = this.invitationsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly loadErrorMessages = this.loadErrorMessagesSignal.asReadonly();

  readonly isInviting = this.isInvitingSignal.asReadonly();
  readonly inviteErrorMessages = this.inviteErrorMessagesSignal.asReadonly();
  readonly inviteSuccessMessage = this.inviteSuccessMessageSignal.asReadonly();

  readonly actionMemberId = this.actionMemberIdSignal.asReadonly();
  readonly actionInvitationId = this.actionInvitationIdSignal.asReadonly();
  readonly actionErrorMessages = this.actionErrorMessagesSignal.asReadonly();
  readonly actionSuccessMessage = this.actionSuccessMessageSignal.asReadonly();

  readonly isAcceptingInvitation = this.isAcceptingInvitationSignal.asReadonly();
  readonly acceptErrorMessages = this.acceptErrorMessagesSignal.asReadonly();
  readonly acceptSuccessMessage = this.acceptSuccessMessageSignal.asReadonly();
  readonly acceptedInvitation = this.acceptedInvitationSignal.asReadonly();

  readonly memberViews = computed(() => this.members().map((member) => toTeamMemberView(member)));
  readonly invitationViews = computed(() =>
    this.invitations().map((invitation) => toTeamInvitationView(invitation)),
  );
  readonly seatUsage = computed(() => buildSeatUsage(this.members(), this.invitations()));
  readonly isBusy = computed(
    () =>
      this.isLoading() ||
      this.isInviting() ||
      this.actionMemberId() !== null ||
      this.actionInvitationId() !== null,
  );

  loadTeam(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoadingSignal.set(true);
    this.loadErrorMessagesSignal.set([]);

    forkJoin({
      members: this.teamApi
        .listMembers()
        .pipe(map((response) => this.unwrap(response, 'Team members could not be loaded.'))),
      invitations: this.teamApi
        .listInvitations()
        .pipe(map((response) => this.unwrap(response, 'Team invitations could not be loaded.'))),
    })
      .pipe(finalize(() => this.isLoadingSignal.set(false)))
      .subscribe({
        next: ({ members, invitations }) => {
          this.membersSignal.set(members);
          this.invitationsSignal.set(invitations);
        },
        error: (error) => this.loadErrorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  inviteMember(request: InviteTeamMemberRequest): Observable<TeamInvitationDto> {
    this.isInvitingSignal.set(true);
    this.inviteErrorMessagesSignal.set([]);
    this.inviteSuccessMessageSignal.set('');

    return this.teamApi.inviteMember(request).pipe(
      map((response) => this.unwrap(response, 'Team invitation could not be created.')),
      tap((invitation) => {
        this.invitationsSignal.update((invitations) => [invitation, ...invitations]);
        this.inviteSuccessMessageSignal.set('Team invitation sent successfully.');
      }),
      catchError((error) => {
        this.inviteErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.isInvitingSignal.set(false)),
    );
  }

  cancelInvitation(id: string): Observable<void> {
    this.actionInvitationIdSignal.set(id);
    this.actionErrorMessagesSignal.set([]);
    this.actionSuccessMessageSignal.set('');

    return this.teamApi.cancelInvitation(id).pipe(
      tap(() => {
        this.invitationsSignal.update((invitations) =>
          invitations.filter((invitation) => invitation.id !== id),
        );
        this.actionSuccessMessageSignal.set('Invitation cancelled successfully.');
      }),
      catchError((error) => {
        this.actionErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.actionInvitationIdSignal.set(null)),
    );
  }

  removeMember(id: string): Observable<void> {
    this.actionMemberIdSignal.set(id);
    this.actionErrorMessagesSignal.set([]);
    this.actionSuccessMessageSignal.set('');

    return this.teamApi.removeMember(id).pipe(
      tap(() => {
        this.membersSignal.update((members) => members.filter((member) => member.id !== id));
        this.actionSuccessMessageSignal.set('Team member removed successfully.');
      }),
      catchError((error) => {
        this.actionErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.actionMemberIdSignal.set(null)),
    );
  }

  changeMemberRole(id: string, request: ChangeTeamMemberRoleRequest): Observable<void> {
    this.actionMemberIdSignal.set(id);
    this.actionErrorMessagesSignal.set([]);
    this.actionSuccessMessageSignal.set('');

    return this.teamApi.changeMemberRole(id, request).pipe(
      map((response) => this.unwrap(response, 'Team member role could not be updated.')),
      tap((updatedMember) => {
        this.membersSignal.update((members) =>
          members.map((member) =>
            member.id === updatedMember.id ? { ...member, role: updatedMember.role } : member,
          ),
        );
        this.actionSuccessMessageSignal.set('Team member role updated successfully.');
      }),
      map(() => undefined),
      catchError((error) => {
        this.actionErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.actionMemberIdSignal.set(null)),
    );
  }

  acceptInvitation(
    token: string,
    request: AcceptTeamInvitationRequest,
  ): Observable<TeamInvitationAcceptedDto> {
    this.isAcceptingInvitationSignal.set(true);
    this.acceptErrorMessagesSignal.set([]);
    this.acceptSuccessMessageSignal.set('');
    this.acceptedInvitationSignal.set(null);

    return this.teamApi.acceptInvitation(token, request).pipe(
      map((response) => this.unwrap(response, 'Team invitation could not be accepted.')),
      tap((acceptedInvitation) => {
        this.acceptedInvitationSignal.set(acceptedInvitation);
        this.acceptSuccessMessageSignal.set('Invitation accepted. You can sign in now.');
      }),
      catchError((error) => {
        this.acceptErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.isAcceptingInvitationSignal.set(false)),
    );
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
