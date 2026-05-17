namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record PaymentPageDto(
    PaymentPageInvoiceDto Invoice,
    string? StripeCheckoutUrl,
    string? Message);

public sealed record PaymentPageInvoiceDto(
    string Number,
    string BusinessName,
    string? BusinessLogo,
    string ClientName,
    decimal Total,
    string Currency,
    DateOnly DueDate,
    string Status);
