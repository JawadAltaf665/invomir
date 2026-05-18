using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Auth.Commands.Logout;

public sealed record LogoutCommand : IRequest<ApiResponse<string>>
{
    [JsonPropertyName("refreshToken")]
    public string? RefreshToken { get; init; }

    [JsonPropertyName("all_devices")]
    public bool AllDevices { get; init; }
}
