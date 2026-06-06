namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeCheckoutSessionRequestDto(
    Guid InvoiceId,
    Guid TenantId,
    string PaymentLinkToken,
    string InvoiceNumber,
    decimal Amount,
    string Currency,
    string ConnectedStripeAccountId);
