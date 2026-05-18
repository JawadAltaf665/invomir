namespace InvoMir.Application.Features.Users.Commands.UpdateCurrentUser;

public sealed record UpdateCurrentUserCommand : IRequest<UserProfileDto>
{
    public string? BusinessName { get; init; }
    public string? Currency { get; init; }
    public decimal? TaxPercent { get; init; }
}
