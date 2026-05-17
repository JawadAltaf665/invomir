namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoicePdfDto(
    byte[] Content,
    string FileName,
    string ContentType,
    DateTime GeneratedAtUtc);
