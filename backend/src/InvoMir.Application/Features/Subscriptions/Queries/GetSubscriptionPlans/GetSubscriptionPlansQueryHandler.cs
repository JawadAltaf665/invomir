using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Queries.GetSubscriptionPlans;

public sealed class GetSubscriptionPlansQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ICurrencyConversionService currencyConversionService,
    IStripeService stripeService)
    : IRequestHandler<GetSubscriptionPlansQuery, SubscriptionPlansDto>
{
    public async Task<SubscriptionPlansDto> Handle(
        GetSubscriptionPlansQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");
        var workspaceCurrency = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.Currency)
            .FirstOrDefaultAsync(cancellationToken);

        if (workspaceCurrency is null)
            throw new NotFoundException(nameof(User), userId);

        var normalizedCurrency = NormalizeCurrency(workspaceCurrency);
        var plans = SubscriptionPlanCatalog.GetPlans()
            .ToList();
        var convertedPrices = await ConvertPlanPricesAsync(
            plans,
            normalizedCurrency,
            cancellationToken);
        var planDtos = plans
            .Zip(convertedPrices, (plan, prices) => new { Plan = plan, Prices = prices })
            .Select(plan => new SubscriptionPlanDto(
                plan.Plan.Plan,
                plan.Plan.Name,
                plan.Plan.Description,
                plan.Prices.PricePerMonth,
                plan.Prices.PricePerYear,
                normalizedCurrency,
                stripeService.IsSubscriptionCheckoutConfigured(
                    plan.Plan.Plan,
                    SubscriptionConstants.Intervals.Month),
                stripeService.IsSubscriptionCheckoutConfigured(
                    plan.Plan.Plan,
                    SubscriptionConstants.Intervals.Year),
                new SubscriptionPlanLimitsDto(
                    plan.Plan.ClientLimit,
                    plan.Plan.InvoiceLimitPerMonth,
                    plan.Plan.TeamSeatLimit),
                new SubscriptionFeaturesDto(
                    plan.Plan.Features.Reminders,
                    plan.Plan.Features.OnlinePayments,
                    plan.Plan.Features.ReportsExport,
                    plan.Plan.Features.TeamSeats)))
            .ToList();

        return new SubscriptionPlansDto(planDtos);
    }

    private async Task<IReadOnlyList<ConvertedPlanPrices>> ConvertPlanPricesAsync(
        IReadOnlyList<SubscriptionPlanDefinition> plans,
        string workspaceCurrency,
        CancellationToken cancellationToken)
    {
        var conversions = await currencyConversionService.ConvertAsync(
            plans
                .SelectMany(plan => new[]
                {
                    new CurrencyAmount(plan.PricePerMonth, plan.Currency),
                    new CurrencyAmount(plan.PricePerYear, plan.Currency)
                })
                .ToList(),
            workspaceCurrency,
            cancellationToken);

        return conversions
            .Chunk(2)
            .Select(conversion => new ConvertedPlanPrices(
                conversion[0].ConvertedAmount,
                conversion[1].ConvertedAmount))
            .ToList();
    }

    private static string NormalizeCurrency(string currency)
    {
        return string.IsNullOrWhiteSpace(currency)
            ? "USD"
            : currency.Trim().ToUpperInvariant();
    }

    private sealed record ConvertedPlanPrices(
        decimal PricePerMonth,
        decimal PricePerYear);
}
