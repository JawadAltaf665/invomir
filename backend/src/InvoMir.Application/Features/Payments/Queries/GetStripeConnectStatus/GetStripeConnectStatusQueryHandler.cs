namespace InvoMir.Application.Features.Payments.Queries.GetStripeConnectStatus;

public sealed class GetStripeConnectStatusQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : IRequestHandler<GetStripeConnectStatusQuery, StripeConnectStatusDto>
{
    public async Task<StripeConnectStatusDto> Handle(
        GetStripeConnectStatusQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var stripeAccountId = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.StripeAccountId)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(stripeAccountId))
            return new StripeConnectStatusDto(false, null, null);

        var connectedAt = await context.AuditLogs
            .AsNoTracking()
            .Where(log =>
                log.EntityName == AuditConstants.Entities.User &&
                log.EntityId == userId &&
                log.Action == AuditConstants.Actions.StripeConnectCompleted)
            .OrderByDescending(log => log.CreatedAt)
            .Select(log => (DateTime?)log.CreatedAt)
            .FirstOrDefaultAsync(cancellationToken);

        return new StripeConnectStatusDto(true, stripeAccountId, connectedAt);
    }
}
