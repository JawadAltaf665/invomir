namespace InvoMir.Application.Features.Reports.DTOs;

public sealed record ReportExportInvoiceDto(
    Guid Id,
    string InvoiceNumber,
    string ClientName,
    string Status,
    DateOnly IssueDate,
    DateOnly DueDate,
    string Currency,
    decimal Subtotal,
    decimal TaxAmount,
    decimal DiscountAmount,
    decimal Total,
    DateTime? SentAt,
    DateTime? PaidAt);
