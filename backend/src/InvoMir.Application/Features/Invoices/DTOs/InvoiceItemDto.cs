namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceItemDto(
    Guid Id,
    string Description,
    decimal Quantity,
    decimal UnitPrice,
    decimal Amount,
    int SortOrder);
