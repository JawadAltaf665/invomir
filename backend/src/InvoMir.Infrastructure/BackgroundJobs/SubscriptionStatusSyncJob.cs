using Hangfire;
using InvoMir.Application.Features.Notifications;
using InvoMir.Application.Features.Team;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class SubscriptionStatusSyncJob(
    IAppDbContext context,
    IStripeService stripeService,
    INotificationService notificationService,
    IAuditService auditService,
    ILogger<SubscriptionStatusSyncJob> logger)
{
    [Queue(BackgroundJobQueues.Critical)]
    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        if (!stripeService.IsSubscriptionStatusSyncConfigured())
        {
            logger.LogInformation("Stripe subscription status sync skipped because Stripe is not configured.");
            return;
        }

        var utcNow = DateTime.UtcNow;
        var subscriptions = await context.Subscriptions
            .IgnoreQueryFilters()
            .Where(subscription =>
                !subscription.IsDeleted &&
                subscription.StripeSubscriptionId != string.Empty &&
                (subscription.Status != SubscriptionConstants.Statuses.Cancelled ||
                    subscription.CancelAtPeriodEnd ||
                    subscription.CurrentPeriodEnd >= utcNow.AddDays(-7)))
            .OrderBy(subscription => subscription.CurrentPeriodEnd)
            .Take(100)
            .ToListAsync(cancellationToken);

        if (subscriptions.Count == 0)
            return;

        var syncedSubscriptions = new List<SubscriptionSyncResult>();
        foreach (var subscription in subscriptions)
        {
            var stripeSubscription = await GetStripeSubscriptionAsync(subscription, cancellationToken);
            if (stripeSubscription is null)
                continue;

            var oldValues = ToAuditSnapshot(subscription);
            var plan = NormalizePaidPlan(stripeSubscription.Plan) ?? subscription.Plan;
            var interval = NormalizeInterval(stripeSubscription.Interval) ?? subscription.Interval;
            var amount = stripeSubscription.Amount > 0 ? stripeSubscription.Amount : subscription.Amount;
            var currency = string.IsNullOrWhiteSpace(stripeSubscription.Currency)
                ? subscription.Currency
                : stripeSubscription.Currency;
            var currentPeriodStart = stripeSubscription.CurrentPeriodStart == default
                ? subscription.CurrentPeriodStart
                : stripeSubscription.CurrentPeriodStart;
            var currentPeriodEnd = stripeSubscription.CurrentPeriodEnd < currentPeriodStart
                ? subscription.CurrentPeriodEnd
                : stripeSubscription.CurrentPeriodEnd;

            subscription.SyncFromStripe(
                stripeSubscription.StripeCustomerId ?? subscription.StripeCustomerId,
                plan,
                stripeSubscription.Status,
                interval,
                amount,
                currency,
                currentPeriodStart,
                currentPeriodEnd,
                stripeSubscription.CancelAtPeriodEnd,
                stripeSubscription.CancelledAt);

            await SyncAccountPlanAsync(
                subscription,
                ResolveAccountPlan(stripeSubscription, plan, utcNow),
                stripeSubscription.StripeCustomerId,
                utcNow,
                cancellationToken);

            var newValues = ToAuditSnapshot(subscription);
            if (oldValues == newValues)
                continue;

            syncedSubscriptions.Add(new SubscriptionSyncResult(subscription, oldValues, newValues));
        }

        if (syncedSubscriptions.Count == 0)
            return;

        await context.SaveChangesAsync(cancellationToken);

        foreach (var result in syncedSubscriptions)
        {
            await auditService.LogAsync(
                AuditConstants.Entities.User,
                result.Subscription.UserId,
                AuditConstants.Actions.SubscriptionSynced,
                result.Subscription.TenantId,
                result.Subscription.UserId,
                result.OldValues,
                result.NewValues,
                cancellationToken: cancellationToken);

            await notificationService.CreateForUserAsync(
                result.Subscription.TenantId,
                result.Subscription.UserId,
                "Subscription status synced",
                $"Your {result.Subscription.Plan} subscription is now {result.Subscription.Status}.",
                NotificationConstants.Types.Subscription,
                result.Subscription.Status == SubscriptionConstants.Statuses.PastDue
                    ? NotificationConstants.Priorities.Critical
                    : NotificationConstants.Priorities.Medium,
                "/app/subscriptions",
                new
                {
                    result.Subscription.Id,
                    result.Subscription.StripeSubscriptionId,
                    result.Subscription.Plan,
                    result.Subscription.Status,
                    result.Subscription.CurrentPeriodEnd
                },
                cancellationToken);
        }

        logger.LogInformation("Synced {SubscriptionCount} Stripe subscriptions.", syncedSubscriptions.Count);
    }

    private async Task<StripeSubscriptionEventDto?> GetStripeSubscriptionAsync(
        Subscription subscription,
        CancellationToken cancellationToken)
    {
        try
        {
            return await stripeService.GetSubscriptionAsync(
                subscription.StripeSubscriptionId,
                cancellationToken);
        }
        catch (BadRequestException exception)
        {
            logger.LogWarning(
                exception,
                "Stripe subscription status sync skipped subscription {SubscriptionId}.",
                subscription.Id);

            return null;
        }
    }

    private async Task SyncAccountPlanAsync(
        Subscription subscription,
        string accountPlan,
        string? stripeCustomerId,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var tenant = await context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentTenant =>
                currentTenant.Id == subscription.TenantId &&
                !currentTenant.IsDeleted,
                cancellationToken);

        if (tenant is not null)
        {
            tenant.UpdatePlan(accountPlan);
            await TeamInvitationLifecycle.CancelPendingInvitationsForPlanAsync(
                context,
                tenant.Id,
                accountPlan,
                utcNow,
                cancellationToken);

            if (!string.IsNullOrWhiteSpace(stripeCustomerId))
                tenant.UpdateStripeCustomerId(stripeCustomerId);
        }

        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentUser =>
                currentUser.Id == subscription.UserId &&
                currentUser.TenantId == subscription.TenantId &&
                !currentUser.IsDeleted,
                cancellationToken);

        user?.UpdatePlan(accountPlan);
    }

    private static string ResolveAccountPlan(
        StripeSubscriptionEventDto stripeSubscription,
        string paidPlan,
        DateTime utcNow)
    {
        if (stripeSubscription.Status == SubscriptionConstants.Statuses.PastDue)
            return AuthConstants.Plans.Free;

        if (stripeSubscription.Status == SubscriptionConstants.Statuses.Cancelled &&
            stripeSubscription.CurrentPeriodEnd <= utcNow)
        {
            return AuthConstants.Plans.Free;
        }

        return paidPlan;
    }

    private static string? NormalizePaidPlan(string? plan)
    {
        var normalizedPlan = plan?.Trim().ToLowerInvariant();
        return normalizedPlan is not null && AuthConstants.Plans.Paid.Contains(normalizedPlan)
            ? normalizedPlan
            : null;
    }

    private static string? NormalizeInterval(string? interval)
    {
        var normalizedInterval = interval?.Trim().ToLowerInvariant();
        return normalizedInterval is not null && SubscriptionConstants.Intervals.All.Contains(normalizedInterval)
            ? normalizedInterval
            : null;
    }

    private static SubscriptionSyncSnapshot ToAuditSnapshot(Subscription subscription)
    {
        return new SubscriptionSyncSnapshot(
            subscription.StripeSubscriptionId,
            subscription.StripeCustomerId,
            subscription.Plan,
            subscription.Status,
            subscription.Interval,
            subscription.Amount,
            subscription.Currency,
            subscription.CurrentPeriodStart,
            subscription.CurrentPeriodEnd,
            subscription.CancelAtPeriodEnd,
            subscription.CancelledAt);
    }

    private sealed record SubscriptionSyncSnapshot(
        string StripeSubscriptionId,
        string? StripeCustomerId,
        string Plan,
        string Status,
        string Interval,
        decimal Amount,
        string Currency,
        DateTime CurrentPeriodStart,
        DateTime CurrentPeriodEnd,
        bool CancelAtPeriodEnd,
        DateTime? CancelledAt);

    private sealed record SubscriptionSyncResult(
        Subscription Subscription,
        SubscriptionSyncSnapshot OldValues,
        SubscriptionSyncSnapshot NewValues);
}
