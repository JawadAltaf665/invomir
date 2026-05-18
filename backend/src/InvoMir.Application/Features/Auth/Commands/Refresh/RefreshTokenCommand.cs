using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Auth.Commands.Refresh;

public sealed record RefreshTokenCommand(
    [property: JsonPropertyName("refreshToken")]
    string? RefreshToken = null) : IRequest<ApiResponse<AuthTokenDto>>;
