using System.Text.Json.Serialization;
using InvoMir.Application.Features.Admin.DTOs;

namespace InvoMir.Application.Features.Admin.Users.Commands.UpdateAdminUserTrial;

public sealed record UpdateAdminUserTrialCommand : IRequest<AdminUserTrialUpdateDto>
{
    [JsonIgnore]
    public Guid Id { get; init; }

    [JsonPropertyName("trialEndsAt")]
    public DateTime TrialEndsAt { get; init; }
}
