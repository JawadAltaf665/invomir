namespace InvoMir.Application.Features.Subscriptions.DTOs;

public sealed record SubscriptionCheckoutDto(
    string CheckoutUrl,
    string SessionId);
