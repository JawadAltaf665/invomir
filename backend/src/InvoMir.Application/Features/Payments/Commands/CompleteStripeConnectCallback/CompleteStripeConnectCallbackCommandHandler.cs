namespace InvoMir.Application.Features.Payments.Commands.CompleteStripeConnectCallback;

public sealed class CompleteStripeConnectCallbackCommandHandler(
    IAppDbContext context,
    IClientContext clientContext,
    IStripeService stripeService,
    IAuditService auditService)
    : IRequestHandler<CompleteStripeConnectCallbackCommand, StripeConnectCallbackDto>
{
    public async Task<StripeConnectCallbackDto> Handle(
        CompleteStripeConnectCallbackCommand request,
        CancellationToken cancellationToken)
    {
        var stateValue = request.State!.Trim();
        var connectState = await context.StripeConnectStates
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                state => state.State == stateValue && !state.IsDeleted,
                cancellationToken);

        if (connectState is null)
            throw new BadRequestException("Invalid Stripe Connect state.");

        if (!connectState.IsActive)
            throw new BadRequestException("Stripe Connect state has expired or already been used.");

        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                currentUser =>
                    currentUser.Id == connectState.UserId &&
                    currentUser.TenantId == connectState.TenantId &&
                    currentUser.IsActive &&
                    !currentUser.IsDeleted,
                cancellationToken);

        if (user is null)
            throw new BadRequestException("Stripe Connect user is no longer available.");

        if (!string.IsNullOrWhiteSpace(user.StripeAccountId))
            throw new BadRequestException("Stripe account is already connected.");

        var tenant = await context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                currentTenant =>
                    currentTenant.Id == connectState.TenantId &&
                    currentTenant.IsActive &&
                    !currentTenant.IsDeleted,
                cancellationToken);

        if (tenant is null)
            throw new BadRequestException("Stripe Connect tenant is no longer available.");

        var connectedAccount = await stripeService.ExchangeConnectAuthorizationCodeAsync(
            request.Code!.Trim(),
            cancellationToken);

        var previousStripeAccountId = user.StripeAccountId;
        user.UpdateStripeAccountId(connectedAccount.StripeAccountId);
        tenant.UpdateStripeAccountId(connectedAccount.StripeAccountId);
        connectState.MarkUsed();

        await context.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync(
            AuditConstants.Entities.User,
            user.Id,
            AuditConstants.Actions.StripeConnectCompleted,
            connectState.TenantId,
            user.Id,
            oldValues: new { stripeAccountId = previousStripeAccountId },
            newValues: new { stripeAccountId = connectedAccount.StripeAccountId },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        return new StripeConnectCallbackDto(
            connectedAccount.StripeAccountId,
            stripeService.GetConnectSuccessRedirectUrl());
    }
}
