namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceEmailDto(
    Guid InvoiceId,
    string ToEmail,
    string ClientName,
    string InvoiceNumber,
    string BusinessName,
    string Currency,
    decimal Total,
    string PaymentLinkToken,
    string? CustomMessage,
    byte[] PdfAttachment,
    string EmailType,
    string? CcEmail);
