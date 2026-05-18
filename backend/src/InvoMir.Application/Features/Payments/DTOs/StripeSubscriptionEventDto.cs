namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeSubscriptionEventDto(
    string StripeSubscriptionId,
    string? StripeCustomerId,
    Guid? TenantId,
    Guid? UserId,
    string? Plan,
    string? Interval,
    string Status,
    decimal Amount,
    string Currency,
    DateTime CurrentPeriodStart,
    DateTime CurrentPeriodEnd,
    bool CancelAtPeriodEnd,
    DateTime? CancelledAt);
