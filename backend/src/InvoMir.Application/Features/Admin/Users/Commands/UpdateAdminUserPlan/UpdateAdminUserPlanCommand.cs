using System.Text.Json.Serialization;
using InvoMir.Application.Features.Admin.DTOs;

namespace InvoMir.Application.Features.Admin.Users.Commands.UpdateAdminUserPlan;

public sealed record UpdateAdminUserPlanCommand : IRequest<AdminUserPlanUpdateDto>
{
    [JsonIgnore]
    public Guid Id { get; init; }
    public string Plan { get; init; } = string.Empty;
}
