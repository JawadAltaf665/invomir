using Hangfire;
using InvoMir.Application.Features.Notifications;
using InvoMir.Application.Features.Team;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class TrialExpiryJob(
    IAppDbContext context,
    INotificationService notificationService,
    ILogger<TrialExpiryJob> logger)
{
    [Queue(BackgroundJobQueues.Critical)]
    [AutomaticRetry(Attempts = 3)]
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;
        await SendTrialEndingWarningsAsync(utcNow, cancellationToken);
        await DowngradeExpiredTrialsAsync(utcNow, cancellationToken);
    }

    private async Task SendTrialEndingWarningsAsync(DateTime utcNow, CancellationToken cancellationToken)
    {
        var warningEnd = utcNow.AddDays(3);
        var recentNotificationCutoff = utcNow.AddHours(-20);
        var tenants = await context.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(tenant =>
                !tenant.IsDeleted &&
                tenant.TrialEndsAt != null &&
                tenant.TrialEndsAt > utcNow &&
                tenant.TrialEndsAt <= warningEnd)
            .OrderBy(tenant => tenant.TrialEndsAt)
            .Take(500)
            .ToListAsync(cancellationToken);

        foreach (var tenant in tenants)
        {
            if (await HasActivePaidSubscriptionAsync(tenant.Id, utcNow, cancellationToken))
                continue;

            var alreadyNotified = await context.Notifications
                .IgnoreQueryFilters()
                .AsNoTracking()
                .AnyAsync(notification =>
                    notification.TenantId == tenant.Id &&
                    !notification.IsDeleted &&
                    notification.Title == "Trial ending soon" &&
                    notification.CreationTime >= recentNotificationCutoff,
                    cancellationToken);

            if (alreadyNotified)
                continue;

            await notificationService.CreateForRoleAsync(
                tenant.Id,
                AuthConstants.Roles.Owner,
                "Trial ending soon",
                $"Your InvoMir trial ends on {tenant.TrialEndsAt:MMM d, yyyy}.",
                NotificationConstants.Types.Subscription,
                NotificationConstants.Priorities.High,
                "/app/subscriptions",
                new
                {
                    tenant.Id,
                    tenant.TrialEndsAt
                },
                cancellationToken);
        }
    }

    private async Task DowngradeExpiredTrialsAsync(DateTime utcNow, CancellationToken cancellationToken)
    {
        var tenants = await context.Tenants
            .IgnoreQueryFilters()
            .Where(tenant =>
                !tenant.IsDeleted &&
                tenant.TrialEndsAt != null &&
                tenant.TrialEndsAt <= utcNow)
            .OrderBy(tenant => tenant.TrialEndsAt)
            .Take(500)
            .ToListAsync(cancellationToken);

        var downgradedCount = 0;
        foreach (var tenant in tenants)
        {
            if (await HasActivePaidSubscriptionAsync(tenant.Id, utcNow, cancellationToken))
                continue;

            var users = await context.Users
                .IgnoreQueryFilters()
                .Where(user =>
                    user.TenantId == tenant.Id &&
                    !user.IsDeleted &&
                    user.Plan != AuthConstants.Plans.Free)
                .ToListAsync(cancellationToken);

            if (tenant.Plan == AuthConstants.Plans.Free && users.Count == 0)
                continue;

            tenant.UpdatePlan(AuthConstants.Plans.Free);
            foreach (var user in users)
                user.UpdatePlan(AuthConstants.Plans.Free);

            await TeamInvitationLifecycle.CancelPendingInvitationsForPlanAsync(
                context,
                tenant.Id,
                AuthConstants.Plans.Free,
                utcNow,
                cancellationToken);

            await context.SaveChangesAsync(cancellationToken);
            downgradedCount++;

            await notificationService.CreateForRoleAsync(
                tenant.Id,
                AuthConstants.Roles.Owner,
                "Trial expired",
                "Your trial ended and the workspace was moved to the free plan.",
                NotificationConstants.Types.Subscription,
                NotificationConstants.Priorities.Critical,
                "/app/subscriptions",
                new
                {
                    tenant.Id,
                    tenant.TrialEndsAt
                },
                cancellationToken);
        }

        if (downgradedCount > 0)
            logger.LogInformation("Downgraded {TenantCount} expired trial workspaces to the free plan.", downgradedCount);
    }

    private async Task<bool> HasActivePaidSubscriptionAsync(
        Guid tenantId,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        return await context.Subscriptions
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(subscription =>
                subscription.TenantId == tenantId &&
                !subscription.IsDeleted &&
                AuthConstants.Plans.Paid.Contains(subscription.Plan) &&
                (subscription.Status == SubscriptionConstants.Statuses.Active ||
                    subscription.Status == SubscriptionConstants.Statuses.Trialing) &&
                subscription.CurrentPeriodEnd > utcNow,
                cancellationToken);
    }
}
