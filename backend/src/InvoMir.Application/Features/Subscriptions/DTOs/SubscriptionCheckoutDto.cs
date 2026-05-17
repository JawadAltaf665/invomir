using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Subscriptions.DTOs;

public sealed record SubscriptionCheckoutDto(
    [property: JsonPropertyName("checkoutUrl")] string CheckoutUrl,
    [property: JsonPropertyName("sessionId")] string SessionId);
