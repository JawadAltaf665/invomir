using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Subscriptions.DTOs;

public sealed record SubscriptionCancellationDto(
    [property: JsonPropertyName("stripeSubscriptionId")] string StripeSubscriptionId,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("cancelAtPeriodEnd")] bool CancelAtPeriodEnd,
    [property: JsonPropertyName("currentPeriodEnd")] DateTime? CurrentPeriodEnd,
    [property: JsonPropertyName("cancelledAt")] DateTime? CancelledAt);
