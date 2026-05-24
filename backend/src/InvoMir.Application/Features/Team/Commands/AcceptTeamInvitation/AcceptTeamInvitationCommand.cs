using System.Text.Json.Serialization;
using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team.Commands.AcceptTeamInvitation;

public sealed record AcceptTeamInvitationCommand : IRequest<TeamInvitationAcceptedDto>
{
    [JsonIgnore]
    public string Token { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
}
