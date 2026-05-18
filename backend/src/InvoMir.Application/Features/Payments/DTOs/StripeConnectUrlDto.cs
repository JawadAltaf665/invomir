namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeConnectUrlDto(
    string OAuthUrl,
    string State);
