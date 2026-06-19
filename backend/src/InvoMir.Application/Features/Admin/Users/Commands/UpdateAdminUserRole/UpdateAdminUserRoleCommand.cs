using System.Text.Json.Serialization;
using InvoMir.Application.Features.Admin.DTOs;

namespace InvoMir.Application.Features.Admin.Users.Commands.UpdateAdminUserRole;

public sealed record UpdateAdminUserRoleCommand : IRequest<AdminUserRoleUpdateDto>
{
    [JsonIgnore]
    public Guid Id { get; init; }
    public string Role { get; init; } = string.Empty;
}
