using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team.Commands.InviteTeamMember;

public sealed record InviteTeamMemberCommand(
    string Email,
    string Role = AuthConstants.Roles.Member) : IRequest<TeamInvitationDto>;
