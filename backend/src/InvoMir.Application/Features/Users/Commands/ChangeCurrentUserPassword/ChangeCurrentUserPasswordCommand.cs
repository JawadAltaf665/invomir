using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Users.Commands.ChangeCurrentUserPassword;

public sealed record ChangeCurrentUserPasswordCommand : IRequest<ApiResponse<string>>
{
    [JsonPropertyName("current_password")]
    public string CurrentPassword { get; init; } = string.Empty;

    [JsonPropertyName("new_password")]
    public string NewPassword { get; init; } = string.Empty;
}
