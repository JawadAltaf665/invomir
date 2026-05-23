using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team.Queries.ListTeamInvitations;

public sealed record ListTeamInvitationsQuery : IRequest<IReadOnlyList<TeamInvitationDto>>;
