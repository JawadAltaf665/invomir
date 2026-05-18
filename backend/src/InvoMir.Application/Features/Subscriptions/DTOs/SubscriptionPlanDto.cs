namespace InvoMir.Application.Features.Subscriptions.DTOs;

public sealed record SubscriptionPlansDto(
    IReadOnlyList<SubscriptionPlanDto> Plans);

public sealed record SubscriptionPlanDto(
    string Plan,
    string Name,
    string Description,
    decimal PricePerMonth,
    decimal PricePerYear,
    string Currency,
    SubscriptionPlanLimitsDto Limits,
    SubscriptionFeaturesDto Features);

public sealed record SubscriptionPlanLimitsDto(
    int? Clients,
    int? InvoicesPerMonth,
    int TeamSeats);

public sealed record SubscriptionFeaturesDto(
    bool Reminders,
    bool OnlinePayments,
    bool ReportsExport,
    bool TeamSeats);
