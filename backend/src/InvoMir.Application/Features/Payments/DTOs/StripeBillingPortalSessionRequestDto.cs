namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeBillingPortalSessionRequestDto(
    string StripeCustomerId);
