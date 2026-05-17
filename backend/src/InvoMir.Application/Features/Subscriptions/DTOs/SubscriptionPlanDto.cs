using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Subscriptions.DTOs;

public sealed record SubscriptionPlansDto(
    [property: JsonPropertyName("plans")] IReadOnlyList<SubscriptionPlanDto> Plans);

public sealed record SubscriptionPlanDto(
    [property: JsonPropertyName("plan")] string Plan,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("description")] string Description,
    [property: JsonPropertyName("pricePerMonth")] decimal PricePerMonth,
    [property: JsonPropertyName("pricePerYear")] decimal PricePerYear,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("limits")] SubscriptionPlanLimitsDto Limits,
    [property: JsonPropertyName("features")] SubscriptionFeaturesDto Features);

public sealed record SubscriptionPlanLimitsDto(
    [property: JsonPropertyName("clients")] int? Clients,
    [property: JsonPropertyName("invoicesPerMonth")] int? InvoicesPerMonth,
    [property: JsonPropertyName("teamSeats")] int TeamSeats);

public sealed record SubscriptionFeaturesDto(
    [property: JsonPropertyName("reminders")] bool Reminders,
    [property: JsonPropertyName("onlinePayments")] bool OnlinePayments,
    [property: JsonPropertyName("reportsExport")] bool ReportsExport,
    [property: JsonPropertyName("teamSeats")] bool TeamSeats);
