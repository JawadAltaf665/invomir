using System.Text.Json.Serialization;
using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team.Commands.ChangeTeamMemberRole;

public sealed record ChangeTeamMemberRoleCommand : IRequest<TeamMemberRoleUpdateDto>
{
    [JsonIgnore]
    public Guid Id { get; init; }
    public string Role { get; init; } = string.Empty;
}
