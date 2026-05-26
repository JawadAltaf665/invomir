namespace InvoMir.Application.Features.Auth.Commands.Logout;

public sealed record LogoutCommand : IRequest<ApiResponse<string>>
{
    public bool AllDevices { get; init; }
}
