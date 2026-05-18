namespace InvoMir.Application.Features.Subscriptions.DTOs;

public sealed record SubscriptionCancellationDto(
    string StripeSubscriptionId,
    string Status,
    bool CancelAtPeriodEnd,
    DateTime? CurrentPeriodEnd,
    DateTime? CancelledAt);
