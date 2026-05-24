using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Queries.GetSubscriptionPlans;

public sealed class GetSubscriptionPlansQueryHandler(IStripeService stripeService)
    : IRequestHandler<GetSubscriptionPlansQuery, SubscriptionPlansDto>
{
    public Task<SubscriptionPlansDto> Handle(
        GetSubscriptionPlansQuery request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var plans = SubscriptionPlanCatalog.GetPlans()
            .Select(plan => new SubscriptionPlanDto(
                plan.Plan,
                plan.Name,
                plan.Description,
                plan.PricePerMonth,
                plan.PricePerYear,
                plan.Currency,
                stripeService.IsSubscriptionCheckoutConfigured(
                    plan.Plan,
                    SubscriptionConstants.Intervals.Month),
                stripeService.IsSubscriptionCheckoutConfigured(
                    plan.Plan,
                    SubscriptionConstants.Intervals.Year),
                new SubscriptionPlanLimitsDto(
                    plan.ClientLimit,
                    plan.InvoiceLimitPerMonth,
                    plan.TeamSeatLimit),
                new SubscriptionFeaturesDto(
                    plan.Features.Reminders,
                    plan.Features.OnlinePayments,
                    plan.Features.ReportsExport,
                    plan.Features.TeamSeats)))
            .ToList();

        return Task.FromResult(new SubscriptionPlansDto(plans));
    }
}
