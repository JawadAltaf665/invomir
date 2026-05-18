namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeConnectCallbackDto(
    string StripeAccountId,
    string RedirectUrl);
