namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record PaymentReceiptEmailDto(
    Guid InvoiceId,
    string ToEmail,
    string ClientName,
    string InvoiceNumber,
    string BusinessName,
    string Currency,
    decimal Amount,
    DateTime PaidAt,
    string Method,
    Guid TenantId,
    Guid UserId);
