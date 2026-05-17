using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Subscriptions.DTOs;

public sealed record CurrentSubscriptionDto(
    [property: JsonPropertyName("plan")] string Plan,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("pricePerMonth")] decimal PricePerMonth,
    [property: JsonPropertyName("pricePerYear")] decimal PricePerYear,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("currentPeriodStart")] DateTime? CurrentPeriodStart,
    [property: JsonPropertyName("currentPeriodEnd")] DateTime? CurrentPeriodEnd,
    [property: JsonPropertyName("trialEndsAt")] DateTime? TrialEndsAt,
    [property: JsonPropertyName("stripeSubscriptionId")] string? StripeSubscriptionId,
    [property: JsonPropertyName("stripeCustomerId")] string? StripeCustomerId,
    [property: JsonPropertyName("cancelAtPeriodEnd")] bool CancelAtPeriodEnd,
    [property: JsonPropertyName("cancelledAt")] DateTime? CancelledAt,
    [property: JsonPropertyName("usage")] SubscriptionUsageDto Usage,
    [property: JsonPropertyName("features")] SubscriptionFeaturesDto Features);

public sealed record SubscriptionUsageDto(
    [property: JsonPropertyName("clients")] SubscriptionUsageMetricDto Clients,
    [property: JsonPropertyName("invoicesThisMonth")] SubscriptionUsageMetricDto InvoicesThisMonth);

public sealed record SubscriptionUsageMetricDto(
    [property: JsonPropertyName("used")] int Used,
    [property: JsonPropertyName("limit")] int? Limit);
