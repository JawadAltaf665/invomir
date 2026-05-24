namespace InvoMir.Application.Features.Team.Commands.CancelTeamInvitation;

public sealed record CancelTeamInvitationCommand(Guid Id) : IRequest<bool>;
