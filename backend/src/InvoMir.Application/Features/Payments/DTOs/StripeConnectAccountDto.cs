using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeConnectAccountDto(
    [property: JsonPropertyName("stripeAccountId")] string StripeAccountId);
