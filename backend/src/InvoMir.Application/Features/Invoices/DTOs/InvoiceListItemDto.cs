namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceListItemDto(
    Guid Id,
    string InvoiceNumber,
    string ClientName,
    string Status,
    decimal Total,
    string Currency,
    decimal OriginalTotal,
    string OriginalCurrency,
    decimal ExchangeRate,
    DateTimeOffset? RatesUpdatedAt,
    DateOnly DueDate,
    DateTime? SentAt);
