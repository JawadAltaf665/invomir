namespace InvoMir.Application.Features.Payments.Commands.DisconnectStripeConnect;

public sealed class DisconnectStripeConnectCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : IRequestHandler<DisconnectStripeConnectCommand, StripeDisconnectResultDto>
{
    public async Task<StripeDisconnectResultDto> Handle(
        DisconnectStripeConnectCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var user = await context.Users
            .FirstOrDefaultAsync(currentUser => currentUser.Id == userId, cancellationToken);

        if (user is null)
            throw new UnauthorizedAccessException("User context is not available.");

        if (string.IsNullOrWhiteSpace(user.StripeAccountId))
            throw new BadRequestException("No Stripe account is connected.");

        user.ClearStripeAccountId();
        await context.SaveChangesAsync(cancellationToken);

        return new StripeDisconnectResultDto("Stripe account disconnected.");
    }
}
