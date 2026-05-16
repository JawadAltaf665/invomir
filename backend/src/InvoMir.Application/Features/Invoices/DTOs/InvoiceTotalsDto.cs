namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceTotalsDto(
    decimal Subtotal,
    decimal TaxPercent,
    decimal TaxAmount,
    decimal DiscountAmount,
    decimal Total);
