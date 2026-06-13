namespace InvoMir.Application.Features.Subscriptions;

public static class SubscriptionPlanCatalog
{
    private static readonly IReadOnlyList<SubscriptionPlanDefinition> Plans =
    [
        new(
            AuthConstants.Plans.Free,
            "Free",
            "Start sending invoices with basic client management.",
            0,
            0,
            "USD",
            2,
            5,
            1,
            new SubscriptionFeatureSet(false, false, false, false)),
        new(
            AuthConstants.Plans.Starter,
            "Starter",
            "For freelancers who need reminders and online payments.",
            9,
            90,
            "USD",
            10,
            null,
            1,
            new SubscriptionFeatureSet(true, true, false, false)),
        new(
            AuthConstants.Plans.Professional,
            "Professional",
            "For growing businesses that need exports and unlimited volume.",
            19,
            190,
            "USD",
            null,
            null,
            1,
            new SubscriptionFeatureSet(true, true, true, false)),
        new(
            AuthConstants.Plans.Business,
            "Business",
            "For teams that need shared billing workflows.",
            49,
            490,
            "USD",
            null,
            null,
            3,
            new SubscriptionFeatureSet(true, true, true, true))
    ];

    public static IReadOnlyList<SubscriptionPlanDefinition> GetPlans() => Plans;

    public static SubscriptionPlanDefinition GetPlan(string plan)
    {
        return Plans.FirstOrDefault(currentPlan => currentPlan.Plan == plan)
            ?? Plans[0];
    }
}

public sealed record SubscriptionPlanDefinition(
    string Plan,
    string Name,
    string Description,
    decimal PricePerMonth,
    decimal PricePerYear,
    string Currency,
    int? ClientLimit,
    int? InvoiceLimitPerMonth,
    int TeamSeatLimit,
    SubscriptionFeatureSet Features);

public sealed record SubscriptionFeatureSet(
    bool Reminders,
    bool OnlinePayments,
    bool ReportsExport,
    bool TeamSeats);
