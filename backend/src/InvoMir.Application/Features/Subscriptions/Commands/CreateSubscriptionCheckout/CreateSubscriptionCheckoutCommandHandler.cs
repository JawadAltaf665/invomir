using InvoMir.Application.Features.Notifications;
using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Commands.CreateSubscriptionCheckout;

public sealed class CreateSubscriptionCheckoutCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IStripeService stripeService,
    IAuditService auditService,
    INotificationService notificationService)
    : IRequestHandler<CreateSubscriptionCheckoutCommand, SubscriptionCheckoutDto>
{
    public async Task<SubscriptionCheckoutDto> Handle(
        CreateSubscriptionCheckoutCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var profile = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Join(
                context.Tenants.AsNoTracking(),
                user => user.TenantId,
                tenant => tenant.Id,
                (user, tenant) => new SubscriptionCheckoutProfile(
                    user.Id,
                    tenant.Id,
                    user.Email,
                    tenant.StripeCustomerId))
            .FirstOrDefaultAsync(cancellationToken);

        if (profile is null)
            throw new UnauthorizedAccessException("User context is not available.");

        var hasActiveSubscription = await context.Subscriptions
            .AsNoTracking()
            .AnyAsync(subscription =>
                subscription.Status != SubscriptionConstants.Statuses.Cancelled &&
                !subscription.CancelAtPeriodEnd,
                cancellationToken);

        if (hasActiveSubscription)
            throw new BadRequestException("An active subscription already exists.");

        var plan = request.Plan.Trim().ToLowerInvariant();
        var interval = request.Interval.Trim().ToLowerInvariant();

        if (!stripeService.IsSubscriptionCheckoutConfigured(plan, interval))
            throw new BadRequestException("Subscription checkout is not available.");

        var checkoutSession = await stripeService.CreateSubscriptionCheckoutSessionAsync(
            new StripeSubscriptionCheckoutRequestDto(
                profile.UserId,
                profile.TenantId,
                profile.Email,
                profile.StripeCustomerId,
                plan,
                interval),
            cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            profile.UserId,
            AuditConstants.Actions.SubscriptionCheckoutStarted,
            tenantContext.TenantId,
            profile.UserId,
            oldValues: null,
            newValues: new { plan, interval },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        await notificationService.CreateForUserAsync(
            profile.TenantId,
            profile.UserId,
            "Checkout started",
            $"{plan} {interval} checkout is ready.",
            NotificationConstants.Types.Subscription,
            NotificationConstants.Priorities.Low,
            "/app/subscriptions",
            new { plan, interval, checkoutSession.Id },
            cancellationToken);

        return new SubscriptionCheckoutDto(checkoutSession.Url, checkoutSession.Id);
    }

    private sealed record SubscriptionCheckoutProfile(
        Guid UserId,
        Guid TenantId,
        string Email,
        string? StripeCustomerId);
}
