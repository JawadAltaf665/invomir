namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceListItemDto(
    Guid Id,
    string InvoiceNumber,
    string ClientName,
    string Status,
    decimal Total,
    string Currency,
    DateOnly DueDate,
    DateTime? SentAt);
