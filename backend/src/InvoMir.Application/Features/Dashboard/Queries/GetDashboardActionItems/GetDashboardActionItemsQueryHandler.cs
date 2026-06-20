using InvoMir.Application.Features.Dashboard.ActionItems;
using InvoMir.Application.Features.Dashboard.DTOs;

namespace InvoMir.Application.Features.Dashboard.Queries.GetDashboardActionItems;

public sealed class GetDashboardActionItemsQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IRolePermissionProvider rolePermissionProvider,
    IEnumerable<IDashboardActionItemProvider> providers)
    : IRequestHandler<GetDashboardActionItemsQuery, DashboardActionItemsDto>
{
    public async Task<DashboardActionItemsDto> Handle(
        GetDashboardActionItemsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");
        var tenantId = tenantContext.TenantId;

        var snapshot = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId && user.TenantId == tenantId)
            .Join(
                context.Tenants.AsNoTracking(),
                user => user.TenantId,
                tenant => tenant.Id,
                (user, tenant) => new DashboardActionSnapshot(
                    user.TenantId,
                    user.Id,
                    user.Role,
                    user.Plan,
                    tenant.Plan,
                    user.TrialEndsAt ?? tenant.TrialEndsAt,
                    user.EmailVerified,
                    tenant.StripeAccountId ?? user.StripeAccountId))
            .FirstOrDefaultAsync(cancellationToken);

        if (snapshot is null)
            throw new NotFoundException(nameof(User), userId);

        var utcNow = DateTime.UtcNow;
        var subscription = await context.Subscriptions
            .AsNoTracking()
            .Where(subscription =>
                subscription.TenantId == snapshot.TenantId &&
                subscription.UserId == snapshot.UserId)
            .OrderByDescending(subscription => subscription.CreationTime)
            .Select(subscription => new DashboardSubscriptionSnapshot(
                subscription.Plan,
                subscription.Status,
                subscription.CurrentPeriodEnd,
                subscription.CancelAtPeriodEnd))
            .FirstOrDefaultAsync(cancellationToken);

        var activeSubscriptionPlan = subscription is not null &&
            !string.Equals(
                subscription.Status,
                SubscriptionConstants.Statuses.Cancelled,
                StringComparison.OrdinalIgnoreCase) &&
            subscription.CurrentPeriodEnd >= utcNow
            ? subscription.Plan
            : null;
        var trialEndsAt = snapshot.TrialEndsAt is not null && snapshot.TrialEndsAt > utcNow
            ? snapshot.TrialEndsAt
            : null;
        var subscriptionStatus = subscription?.Status ??
            (trialEndsAt is not null
                ? SubscriptionConstants.Statuses.Trialing
                : SubscriptionConstants.Statuses.Active);
        var cancellationScheduled = subscription is not null &&
            subscription.CancelAtPeriodEnd &&
            !string.Equals(
                subscription.Status,
                SubscriptionConstants.Statuses.Cancelled,
                StringComparison.OrdinalIgnoreCase) &&
            subscription.CurrentPeriodEnd >= utcNow;

        var actionContext = new DashboardActionContext(
            snapshot.TenantId,
            snapshot.UserId,
            snapshot.Role,
            ResolvePlan(activeSubscriptionPlan, snapshot.UserPlan, snapshot.TenantPlan),
            snapshot.EmailVerified,
            snapshot.StripeAccountId,
            subscriptionStatus,
            trialEndsAt,
            CalculateTrialDaysRemaining(trialEndsAt, utcNow),
            cancellationScheduled,
            rolePermissionProvider.GetPermissionsForRole(snapshot.Role));

        var items = new List<DashboardActionItemDto>();
        foreach (var provider in providers)
        {
            var providedItems = await provider.GetItemsAsync(actionContext, cancellationToken);
            items.AddRange(providedItems);
        }

        return new DashboardActionItemsDto(
            items
                .OrderByDescending(item => item.Priority)
                .ThenBy(item => item.Id)
                .ToList());
    }

    private static string ResolvePlan(string? subscriptionPlan, string userPlan, string tenantPlan)
    {
        var normalizedSubscriptionPlan = NormalizePlan(subscriptionPlan);
        if (AuthConstants.Plans.Paid.Contains(normalizedSubscriptionPlan))
            return normalizedSubscriptionPlan;

        var normalizedUserPlan = NormalizePlan(userPlan);
        return AuthConstants.Plans.Paid.Contains(normalizedUserPlan)
            ? normalizedUserPlan
            : NormalizePlan(tenantPlan);
    }

    private static string NormalizePlan(string? plan)
    {
        var normalizedPlan = string.IsNullOrWhiteSpace(plan)
            ? AuthConstants.Plans.Free
            : plan.Trim().ToLowerInvariant();

        return AuthConstants.Plans.All.Contains(normalizedPlan)
            ? normalizedPlan
            : AuthConstants.Plans.Free;
    }

    private static int? CalculateTrialDaysRemaining(DateTime? trialEndsAt, DateTime now)
    {
        if (trialEndsAt is null || trialEndsAt <= now)
            return null;

        return Math.Max(1, (int)Math.Ceiling((trialEndsAt.Value - now).TotalDays));
    }

    private sealed record DashboardActionSnapshot(
        Guid TenantId,
        Guid UserId,
        string Role,
        string UserPlan,
        string TenantPlan,
        DateTime? TrialEndsAt,
        bool EmailVerified,
        string? StripeAccountId);

    private sealed record DashboardSubscriptionSnapshot(
        string Plan,
        string Status,
        DateTime CurrentPeriodEnd,
        bool CancelAtPeriodEnd);
}
