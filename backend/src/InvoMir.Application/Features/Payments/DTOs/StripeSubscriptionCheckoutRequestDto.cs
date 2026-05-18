namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeSubscriptionCheckoutRequestDto(
    Guid UserId,
    Guid TenantId,
    string UserEmail,
    string? StripeCustomerId,
    string Plan,
    string Interval);
