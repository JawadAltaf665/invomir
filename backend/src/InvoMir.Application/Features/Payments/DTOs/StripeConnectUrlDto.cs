using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeConnectUrlDto(
    [property: JsonPropertyName("oauthUrl")] string OAuthUrl,
    string State);
