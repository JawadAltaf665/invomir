namespace InvoMir.Application.Features.Users.Commands.ChangeCurrentUserPassword;

public sealed record ChangeCurrentUserPasswordCommand : IRequest<ApiResponse<string>>
{
    public string CurrentPassword { get; init; } = string.Empty;
    public string NewPassword { get; init; } = string.Empty;
}
