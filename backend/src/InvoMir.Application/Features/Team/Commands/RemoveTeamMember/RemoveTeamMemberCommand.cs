namespace InvoMir.Application.Features.Team.Commands.RemoveTeamMember;

public sealed record RemoveTeamMemberCommand(Guid Id) : IRequest<bool>;
