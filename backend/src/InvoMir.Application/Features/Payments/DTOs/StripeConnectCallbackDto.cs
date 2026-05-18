using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeConnectCallbackDto(
    [property: JsonPropertyName("stripeAccountId")] string StripeAccountId,
    [property: JsonPropertyName("redirectUrl")] string RedirectUrl);
