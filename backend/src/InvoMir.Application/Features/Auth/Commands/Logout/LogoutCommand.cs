namespace InvoMir.Application.Features.Auth.Commands.Logout;

public sealed record LogoutCommand : IRequest<ApiResponse<string>>
{
    public string? RefreshToken { get; init; }
    public bool AllDevices { get; init; }
}
