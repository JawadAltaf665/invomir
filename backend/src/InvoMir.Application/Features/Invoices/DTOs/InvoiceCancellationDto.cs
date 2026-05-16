namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceCancellationDto(
    Guid Id,
    string Status,
    DateTime? CancelledAt);
