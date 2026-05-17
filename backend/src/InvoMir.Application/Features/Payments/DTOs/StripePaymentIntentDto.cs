namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripePaymentIntentDto(
    string Id,
    Guid? InvoiceId,
    decimal Amount,
    string Currency,
    string Status,
    string? LatestChargeId,
    string? FailureReason,
    DateTime ReceivedAtUtc);
