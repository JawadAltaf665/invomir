namespace InvoMir.Application.Features.Auth.Commands.VerifyEmail;

public sealed record VerifyEmailCommand(string Token) : IRequest<ApiResponse<string>>;
