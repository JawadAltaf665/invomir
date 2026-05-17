namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeWebhookEventDto(
    string Id,
    string Type,
    StripePaymentIntentDto? PaymentIntent);
