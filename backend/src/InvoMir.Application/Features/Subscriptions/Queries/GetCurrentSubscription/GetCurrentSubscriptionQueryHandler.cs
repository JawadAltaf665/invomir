using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Queries.GetCurrentSubscription;

public sealed class GetCurrentSubscriptionQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : IRequestHandler<GetCurrentSubscriptionQuery, CurrentSubscriptionDto>
{
    public async Task<CurrentSubscriptionDto> Handle(
        GetCurrentSubscriptionQuery request,
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
                (user, tenant) => new SubscriptionProfileSnapshot(
                    user.Id,
                    tenant.Id,
                    user.Plan,
                    user.TrialEndsAt ?? tenant.TrialEndsAt,
                    tenant.StripeCustomerId))
            .FirstOrDefaultAsync(cancellationToken);

        if (profile is null)
            throw new NotFoundException(nameof(User), userId);

        var subscription = await context.Subscriptions
            .AsNoTracking()
            .OrderByDescending(currentSubscription => currentSubscription.CreationTime)
            .Select(currentSubscription => new SubscriptionSnapshot(
                currentSubscription.StripeSubscriptionId,
                currentSubscription.StripeCustomerId,
                currentSubscription.Plan,
                currentSubscription.Status,
                currentSubscription.Amount,
                currentSubscription.Currency,
                currentSubscription.CurrentPeriodStart,
                currentSubscription.CurrentPeriodEnd,
                currentSubscription.CancelAtPeriodEnd,
                currentSubscription.CancelledAt))
            .FirstOrDefaultAsync(cancellationToken);

        var clientCount = await context.Clients.CountAsync(cancellationToken);
        var utcNow = DateTime.UtcNow;
        var monthStart = new DateOnly(utcNow.Year, utcNow.Month, 1);
        var nextMonthStart = monthStart.AddMonths(1);
        var invoiceCount = await context.Invoices
            .Where(invoice => invoice.IssueDate >= monthStart && invoice.IssueDate < nextMonthStart)
            .CountAsync(cancellationToken);

        return BuildDto(profile, subscription, clientCount, invoiceCount);
    }

    private static CurrentSubscriptionDto BuildDto(
        SubscriptionProfileSnapshot profile,
        SubscriptionSnapshot? subscription,
        int clientCount,
        int invoiceCount)
    {
        var now = DateTime.UtcNow;
        var activeTrial = profile.TrialEndsAt is not null && profile.TrialEndsAt > now;
        var planName = subscription?.Plan ?? profile.Plan;
        var status = subscription?.Status ??
            (activeTrial ? SubscriptionConstants.Statuses.Trialing : SubscriptionConstants.Statuses.Active);
        var plan = SubscriptionPlanCatalog.GetPlan(planName);

        return new CurrentSubscriptionDto(
            plan.Plan,
            status,
            plan.PricePerMonth,
            plan.PricePerYear,
            subscription?.Currency ?? plan.Currency,
            subscription?.CurrentPeriodStart,
            subscription?.CurrentPeriodEnd,
            activeTrial ? profile.TrialEndsAt : null,
            subscription?.StripeSubscriptionId,
            subscription?.StripeCustomerId ?? profile.StripeCustomerId,
            subscription?.CancelAtPeriodEnd ?? false,
            subscription?.CancelledAt,
            new SubscriptionUsageDto(
                new SubscriptionUsageMetricDto(clientCount, plan.ClientLimit),
                new SubscriptionUsageMetricDto(invoiceCount, plan.InvoiceLimitPerMonth)),
            new SubscriptionFeaturesDto(
                plan.Features.Reminders,
                plan.Features.OnlinePayments,
                plan.Features.ReportsExport,
                plan.Features.TeamSeats));
    }

    private sealed record SubscriptionProfileSnapshot(
        Guid UserId,
        Guid TenantId,
        string Plan,
        DateTime? TrialEndsAt,
        string? StripeCustomerId);

    private sealed record SubscriptionSnapshot(
        string StripeSubscriptionId,
        string? StripeCustomerId,
        string Plan,
        string Status,
        decimal Amount,
        string Currency,
        DateTime CurrentPeriodStart,
        DateTime CurrentPeriodEnd,
        bool CancelAtPeriodEnd,
        DateTime? CancelledAt);
}
