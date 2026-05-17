namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeSubscriptionCheckoutCompletedDto(
    string SessionId,
    string StripeSubscriptionId,
    string? StripeCustomerId,
    Guid? TenantId,
    Guid? UserId,
    string? Plan,
    string? Interval);
