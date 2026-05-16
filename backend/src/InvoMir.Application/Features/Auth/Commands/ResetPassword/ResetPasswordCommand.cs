namespace InvoMir.Application.Features.Auth.Commands.ResetPassword;

public sealed record ResetPasswordCommand(string Token, string NewPassword) : IRequest<ApiResponse<string>>;
