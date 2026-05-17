namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceIssuerDto(
    string BusinessName,
    string? Email,
    string? LogoUrl);
