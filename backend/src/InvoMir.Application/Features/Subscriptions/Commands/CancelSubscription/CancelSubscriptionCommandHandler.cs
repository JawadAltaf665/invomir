using InvoMir.Application.Features.Notifications;
using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Commands.CancelSubscription;

public sealed class CancelSubscriptionCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IStripeService stripeService,
    IEmailService emailService,
    IAuditService auditService,
    INotificationService notificationService)
    : IRequestHandler<CancelSubscriptionCommand, SubscriptionCancellationDto>
{
    public async Task<SubscriptionCancellationDto> Handle(
        CancelSubscriptionCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var userEmail = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.Email)
            .FirstOrDefaultAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(userEmail))
            throw new UnauthorizedAccessException("User context is not available.");

        var subscription = await context.Subscriptions
            .Where(currentSubscription =>
                currentSubscription.Status != SubscriptionConstants.Statuses.Cancelled &&
                !currentSubscription.CancelAtPeriodEnd)
            .OrderByDescending(currentSubscription => currentSubscription.CreationTime)
            .FirstOrDefaultAsync(cancellationToken);

        if (subscription is null)
            throw new BadRequestException("No active subscription was found.");

        var oldValues = ToAuditSnapshot(subscription);
        var cancellation = await stripeService.CancelSubscriptionAtPeriodEndAsync(
            subscription.StripeSubscriptionId,
            cancellationToken);

        var cancelledAt = cancellation.CancelledAt ?? DateTime.UtcNow;
        var currentPeriodEnd = cancellation.CurrentPeriodEnd ?? subscription.CurrentPeriodEnd;
        subscription.ScheduleCancellation(cancelledAt, currentPeriodEnd);

        await context.SaveChangesAsync(cancellationToken);

        await emailService.SendSubscriptionCancelledAsync(
            userEmail,
            subscription.Plan,
            subscription.CurrentPeriodEnd,
            subscription.TenantId,
            cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            userId,
            AuditConstants.Actions.SubscriptionCancelled,
            tenantContext.TenantId,
            userId,
            oldValues,
            ToAuditSnapshot(subscription),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        await notificationService.CreateForUserAsync(
            subscription.TenantId,
            userId,
            "Subscription cancellation scheduled",
            $"Your {subscription.Plan} plan remains active until {subscription.CurrentPeriodEnd:yyyy-MM-dd}.",
            NotificationConstants.Types.Subscription,
            NotificationConstants.Priorities.High,
            "/app/subscriptions",
            new
            {
                subscription.Id,
                subscription.Plan,
                subscription.Status,
                subscription.CurrentPeriodEnd,
                subscription.CancelAtPeriodEnd
            },
            cancellationToken);

        return new SubscriptionCancellationDto(
            subscription.StripeSubscriptionId,
            subscription.Status,
            subscription.CancelAtPeriodEnd,
            subscription.CurrentPeriodEnd,
            subscription.CancelledAt);
    }

    private static object ToAuditSnapshot(Subscription subscription)
    {
        return new
        {
            subscription.StripeSubscriptionId,
            subscription.Plan,
            subscription.Status,
            subscription.Interval,
            subscription.Amount,
            subscription.Currency,
            subscription.CurrentPeriodEnd,
            subscription.CancelAtPeriodEnd,
            subscription.CancelledAt
        };
    }
}
