namespace InvoMir.Application.Features.Auth.Commands.GoogleLogin;

public sealed record GoogleLoginCommand(string IdToken) : IRequest<ApiResponse<AuthTokenDto>>;
