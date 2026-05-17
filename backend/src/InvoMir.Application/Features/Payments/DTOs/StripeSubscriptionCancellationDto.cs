namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeSubscriptionCancellationDto(
    string StripeSubscriptionId,
    string Status,
    bool CancelAtPeriodEnd,
    DateTime? CurrentPeriodEnd,
    DateTime? CancelledAt);
