using InvoMir.Application.Features.Dashboard.DTOs;
using InvoMir.Application.Features.Subscriptions;

namespace InvoMir.Application.Features.Dashboard.ActionItems;

public sealed class PaymentAccountRequiredDashboardActionItemProvider : IDashboardActionItemProvider
{
    public Task<IReadOnlyList<DashboardActionItemDto>> GetItemsAsync(
        DashboardActionContext context,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        if (!CanManagePaymentAccount(context))
            return Task.FromResult<IReadOnlyList<DashboardActionItemDto>>([]);

        var plan = SubscriptionPlanCatalog.GetPlan(context.Plan);
        if (!AuthConstants.Plans.Paid.Contains(plan.Plan) ||
            !plan.Features.OnlinePayments ||
            !string.IsNullOrWhiteSpace(context.StripeAccountId))
        {
            return Task.FromResult<IReadOnlyList<DashboardActionItemDto>>([]);
        }

        IReadOnlyList<DashboardActionItemDto> items =
        [
            new(
                DashboardActionConstants.Ids.PaymentAccountRequired,
                DashboardActionConstants.Types.Warning,
                "Connect your payment account",
                "Clients cannot pay invoices online until a payment account is connected.",
                "Connect Account",
                "/app/payments",
                false,
                DashboardActionConstants.Priorities.PaymentAccountRequired)
        ];

        return Task.FromResult(items);
    }

    private static bool CanManagePaymentAccount(DashboardActionContext context)
    {
        return context.Permissions.Contains(
            Permissions.Payment.Manage,
            StringComparer.OrdinalIgnoreCase);
    }
}
