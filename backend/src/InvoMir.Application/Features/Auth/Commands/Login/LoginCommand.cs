namespace InvoMir.Application.Features.Auth.Commands.Login;

public sealed record LoginCommand(string Email, string Password) : IRequest<ApiResponse<AuthTokenDto>>;
