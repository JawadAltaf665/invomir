namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceDetailDto(
    Guid Id,
    string InvoiceNumber,
    string Status,
    InvoiceClientDto Client,
    IReadOnlyList<InvoiceItemDto> Items,
    DateOnly IssueDate,
    DateOnly DueDate,
    string Currency,
    decimal Subtotal,
    decimal TaxPercent,
    decimal TaxAmount,
    decimal DiscountAmount,
    decimal Total,
    string? Notes,
    DateTime? SentAt,
    DateTime? ViewedAt,
    DateTime? PaidAt,
    DateTime? CancelledAt);
