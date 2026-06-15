using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Commands.CreateSubscriptionPortal;

public sealed class CreateSubscriptionPortalCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    IStripeService stripeService)
    : IRequestHandler<CreateSubscriptionPortalCommand, SubscriptionPortalDto>
{
    public async Task<SubscriptionPortalDto> Handle(
        CreateSubscriptionPortalCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var stripeCustomerId = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Join(
                context.Tenants.AsNoTracking(),
                user => user.TenantId,
                tenant => tenant.Id,
                (user, tenant) => tenant.StripeCustomerId)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(stripeCustomerId))
        {
            stripeCustomerId = await context.Subscriptions
                .AsNoTracking()
                .Where(subscription => subscription.StripeCustomerId != null &&
                    subscription.StripeCustomerId != string.Empty)
                .OrderByDescending(subscription => subscription.CreationTime)
                .Select(subscription => subscription.StripeCustomerId)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(stripeCustomerId))
            throw new BadRequestException("No Stripe customer was found for this workspace.");

        var portalSession = await stripeService.CreateBillingPortalSessionAsync(
            new StripeBillingPortalSessionRequestDto(stripeCustomerId),
            cancellationToken);

        return new SubscriptionPortalDto(portalSession.Url, portalSession.Id);
    }
}
