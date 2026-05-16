namespace InvoMir.Application.Features.Clients.DTOs;

public sealed record ClientInvoiceSummaryDto(
    Guid Id,
    string InvoiceNumber,
    string Status,
    decimal Total,
    string Currency,
    DateOnly DueDate);
