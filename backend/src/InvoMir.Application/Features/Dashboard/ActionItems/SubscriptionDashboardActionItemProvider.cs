using InvoMir.Application.Features.Dashboard.DTOs;
using InvoMir.Application.Features.Subscriptions;

namespace InvoMir.Application.Features.Dashboard.ActionItems;

public sealed class SubscriptionDashboardActionItemProvider : IDashboardActionItemProvider
{
    private const int TrialEndingWarningDays = 7;
    private const string SubscriptionActionUrl = "/app/subscriptions";

    public Task<IReadOnlyList<DashboardActionItemDto>> GetItemsAsync(
        DashboardActionContext context,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!CanViewSubscription(context))
            return Task.FromResult<IReadOnlyList<DashboardActionItemDto>>([]);

        var plan = SubscriptionPlanCatalog.GetPlan(context.Plan);

        if (IsStatus(context, SubscriptionConstants.Statuses.PastDue))
            return Task.FromResult<IReadOnlyList<DashboardActionItemDto>>([CreatePastDueItem()]);

        if (context.CancelAtPeriodEnd)
            return Task.FromResult<IReadOnlyList<DashboardActionItemDto>>([CreateCancellationScheduledItem()]);

        if (IsStatus(context, SubscriptionConstants.Statuses.Cancelled))
            return Task.FromResult<IReadOnlyList<DashboardActionItemDto>>([CreateFreePlanItem()]);

        if (IsTrialEnding(context))
            return Task.FromResult<IReadOnlyList<DashboardActionItemDto>>([CreateTrialEndingItem(context.TrialDaysRemaining!.Value)]);

        if (plan.Plan == AuthConstants.Plans.Free)
            return Task.FromResult<IReadOnlyList<DashboardActionItemDto>>([CreateFreePlanItem()]);

        return Task.FromResult<IReadOnlyList<DashboardActionItemDto>>([CreateActivePlanItem(plan.Name)]);
    }

    private static DashboardActionItemDto CreatePastDueItem()
    {
        return new DashboardActionItemDto(
            DashboardActionConstants.Ids.SubscriptionPastDue,
            DashboardActionConstants.Types.Critical,
            "Subscription payment needs attention",
            "Your subscription payment could not be completed. Update billing to keep premium features active.",
            "Manage Plan",
            SubscriptionActionUrl,
            true,
            DashboardActionConstants.Priorities.SubscriptionPastDue);
    }

    private static DashboardActionItemDto CreateCancellationScheduledItem()
    {
        return new DashboardActionItemDto(
            DashboardActionConstants.Ids.SubscriptionCancellationScheduled,
            DashboardActionConstants.Types.Warning,
            "Subscription ends after this period",
            "Your paid plan is scheduled to end at the close of the current billing period.",
            "Manage Plan",
            SubscriptionActionUrl,
            true,
            DashboardActionConstants.Priorities.SubscriptionCancellationScheduled);
    }

    private static DashboardActionItemDto CreateTrialEndingItem(int daysRemaining)
    {
        var dayLabel = daysRemaining == 1 ? "day" : "days";

        return new DashboardActionItemDto(
            DashboardActionConstants.Ids.SubscriptionTrialEnding,
            DashboardActionConstants.Types.Warning,
            "Trial ending soon",
            $"Your trial ends in {daysRemaining} {dayLabel}. Choose a plan to keep your workspace running smoothly.",
            "View Plans",
            SubscriptionActionUrl,
            true,
            DashboardActionConstants.Priorities.SubscriptionExpiring);
    }

    private static DashboardActionItemDto CreateFreePlanItem()
    {
        return new DashboardActionItemDto(
            DashboardActionConstants.Ids.SubscriptionFreePlan,
            DashboardActionConstants.Types.Info,
            "Upgrade your InvoMir plan",
            "Unlock reminders, online payments, exports, and higher workspace limits with a paid plan.",
            "View Plans",
            SubscriptionActionUrl,
            true,
            DashboardActionConstants.Priorities.SubscriptionUpgrade);
    }

    private static DashboardActionItemDto CreateActivePlanItem(string planName)
    {
        return new DashboardActionItemDto(
            DashboardActionConstants.Ids.SubscriptionActive,
            DashboardActionConstants.Types.Success,
            $"{planName} plan is active",
            "Review your subscription, billing details, and usage limits from one place.",
            "Manage Plan",
            SubscriptionActionUrl,
            true,
            DashboardActionConstants.Priorities.SubscriptionActive);
    }

    private static bool IsTrialEnding(DashboardActionContext context)
    {
        return IsStatus(context, SubscriptionConstants.Statuses.Trialing) &&
            context.TrialDaysRemaining is > 0 and <= TrialEndingWarningDays;
    }

    private static bool IsStatus(DashboardActionContext context, string status)
    {
        return string.Equals(context.SubscriptionStatus, status, StringComparison.OrdinalIgnoreCase);
    }

    private static bool CanViewSubscription(DashboardActionContext context)
    {
        return context.Permissions.Contains(
            Permissions.Subscription.View,
            StringComparer.OrdinalIgnoreCase);
    }
}
