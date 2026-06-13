using Hangfire;
using InvoMir.Application.Features.Subscriptions;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class UsageLimitAuditJob(
    IAppDbContext context,
    INotificationService notificationService,
    ILogger<UsageLimitAuditJob> logger)
{
    private const decimal WarningThreshold = 0.8m;
    private static readonly string[] UsageLimitTitles =
    [
        "Client limit almost reached",
        "Client limit reached",
        "Invoice limit almost reached",
        "Invoice limit reached"
    ];

    [Queue(BackgroundJobQueues.Maintenance)]
    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;
        var tenants = await context.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(tenant => !tenant.IsDeleted && tenant.IsActive)
            .OrderBy(tenant => tenant.CreationTime)
            .Select(tenant => new TenantUsageProfile(tenant.Id, tenant.Plan))
            .Take(500)
            .ToListAsync(cancellationToken);

        if (tenants.Count == 0)
            return;

        var tenantIds = tenants.Select(tenant => tenant.Id).ToArray();
        var monthStart = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonthStart = monthStart.AddMonths(1);
        var clientCounts = await GetClientCountsAsync(tenantIds, cancellationToken);
        var invoiceCounts = await GetInvoiceCountsAsync(tenantIds, monthStart, nextMonthStart, cancellationToken);
        var existingNotificationKeys = await GetRecentNotificationKeysAsync(
            tenantIds,
            utcNow.AddHours(-24),
            cancellationToken);

        var notificationCount = 0;
        foreach (var tenant in tenants)
        {
            var plan = SubscriptionPlanCatalog.GetPlan(tenant.Plan);

            if (plan.ClientLimit is not null)
            {
                notificationCount += await NotifyIfLimitNeedsAttentionAsync(
                    tenant.Id,
                    "client",
                    clientCounts.GetValueOrDefault(tenant.Id),
                    plan.ClientLimit.Value,
                    "/app/clients",
                    existingNotificationKeys,
                    cancellationToken);
            }

            if (plan.InvoiceLimitPerMonth is not null)
            {
                notificationCount += await NotifyIfLimitNeedsAttentionAsync(
                    tenant.Id,
                    "invoice",
                    invoiceCounts.GetValueOrDefault(tenant.Id),
                    plan.InvoiceLimitPerMonth.Value,
                    "/app/invoices",
                    existingNotificationKeys,
                    cancellationToken);
            }
        }

        if (notificationCount > 0)
            logger.LogInformation("Usage limit audit created {NotificationCount} notifications.", notificationCount);
    }

    private async Task<Dictionary<Guid, int>> GetClientCountsAsync(
        Guid[] tenantIds,
        CancellationToken cancellationToken)
    {
        return await context.Clients
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(client =>
                tenantIds.Contains(client.TenantId) &&
                !client.IsDeleted)
            .GroupBy(client => client.TenantId)
            .Select(group => new TenantCount(group.Key, group.Count()))
            .ToDictionaryAsync(count => count.TenantId, count => count.Count, cancellationToken);
    }

    private async Task<Dictionary<Guid, int>> GetInvoiceCountsAsync(
        Guid[] tenantIds,
        DateTime monthStart,
        DateTime nextMonthStart,
        CancellationToken cancellationToken)
    {
        return await context.Invoices
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(invoice =>
                tenantIds.Contains(invoice.TenantId) &&
                !invoice.IsDeleted &&
                invoice.CreationTime >= monthStart &&
                invoice.CreationTime < nextMonthStart)
            .GroupBy(invoice => invoice.TenantId)
            .Select(group => new TenantCount(group.Key, group.Count()))
            .ToDictionaryAsync(count => count.TenantId, count => count.Count, cancellationToken);
    }

    private async Task<HashSet<UsageNotificationKey>> GetRecentNotificationKeysAsync(
        Guid[] tenantIds,
        DateTime cutoffUtc,
        CancellationToken cancellationToken)
    {
        var notifications = await context.Notifications
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(notification =>
                tenantIds.Contains(notification.TenantId) &&
                !notification.IsDeleted &&
                notification.CreationTime >= cutoffUtc &&
                UsageLimitTitles.Contains(notification.Title))
            .Select(notification => new UsageNotificationKey(notification.TenantId, notification.Title))
            .ToListAsync(cancellationToken);

        return notifications.ToHashSet();
    }

    private async Task<int> NotifyIfLimitNeedsAttentionAsync(
        Guid tenantId,
        string metric,
        int used,
        int limit,
        string actionUrl,
        HashSet<UsageNotificationKey> existingNotificationKeys,
        CancellationToken cancellationToken)
    {
        if (limit <= 0 || used < CalculateWarningPoint(limit))
            return 0;

        var reached = used >= limit;
        var title = BuildTitle(metric, reached);
        var notificationKey = new UsageNotificationKey(tenantId, title);
        if (existingNotificationKeys.Contains(notificationKey))
            return 0;

        var createdCount = await notificationService.CreateForRoleAsync(
            tenantId,
            AuthConstants.Roles.Owner,
            title,
            BuildMessage(metric, used, limit, reached),
            NotificationConstants.Types.Subscription,
            reached ? NotificationConstants.Priorities.High : NotificationConstants.Priorities.Medium,
            actionUrl,
            new
            {
                metric,
                used,
                limit,
                reached
            },
            cancellationToken);

        if (createdCount > 0)
            existingNotificationKeys.Add(notificationKey);

        return createdCount;
    }

    private static int CalculateWarningPoint(int limit)
    {
        return Math.Max(1, (int)Math.Ceiling(limit * WarningThreshold));
    }

    private static string BuildTitle(string metric, bool reached)
    {
        var label = metric == "client" ? "Client" : "Invoice";
        return reached ? $"{label} limit reached" : $"{label} limit almost reached";
    }

    private static string BuildMessage(
        string metric,
        int used,
        int limit,
        bool reached)
    {
        var label = metric == "client" ? "clients" : "monthly invoices";
        var action = reached ? "Upgrade to add more." : "Upgrade before this blocks new work.";
        return $"You have used {used} of {limit} {label}. {action}";
    }

    private sealed record TenantUsageProfile(Guid Id, string Plan);

    private sealed record TenantCount(Guid TenantId, int Count);

    private sealed record UsageNotificationKey(Guid TenantId, string Title);
}
