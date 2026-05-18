namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceSendResultDto(
    Guid Id,
    string InvoiceNumber,
    string Status,
    DateTime? SentAt,
    string PaymentLink,
    IReadOnlyList<DateTime> RemindersScheduledAtUtc);
