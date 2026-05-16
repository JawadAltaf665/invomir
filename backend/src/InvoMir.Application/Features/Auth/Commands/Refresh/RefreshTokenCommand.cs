namespace InvoMir.Application.Features.Auth.Commands.Refresh;

public sealed record RefreshTokenCommand : IRequest<ApiResponse<AuthTokenDto>>;
