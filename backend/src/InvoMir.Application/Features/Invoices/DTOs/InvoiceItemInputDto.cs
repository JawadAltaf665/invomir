namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceItemInputDto(
    string Description,
    decimal Quantity,
    decimal UnitPrice);
