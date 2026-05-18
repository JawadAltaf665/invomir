namespace InvoMir.Application.Features.Subscriptions.DTOs;

public sealed record CurrentSubscriptionDto(
    string Plan,
    string Status,
    decimal PricePerMonth,
    decimal PricePerYear,
    string Currency,
    DateTime? CurrentPeriodStart,
    DateTime? CurrentPeriodEnd,
    DateTime? TrialEndsAt,
    string? StripeSubscriptionId,
    string? StripeCustomerId,
    bool CancelAtPeriodEnd,
    DateTime? CancelledAt,
    SubscriptionUsageDto Usage,
    SubscriptionFeaturesDto Features);

public sealed record SubscriptionUsageDto(
    SubscriptionUsageMetricDto Clients,
    SubscriptionUsageMetricDto InvoicesThisMonth);

public sealed record SubscriptionUsageMetricDto(
    int Used,
    int? Limit);
