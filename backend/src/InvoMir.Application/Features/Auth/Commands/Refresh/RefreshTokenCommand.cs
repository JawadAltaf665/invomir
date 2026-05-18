namespace InvoMir.Application.Features.Auth.Commands.Refresh;

public sealed record RefreshTokenCommand(
    string? RefreshToken = null) : IRequest<ApiResponse<AuthTokenDto>>;
