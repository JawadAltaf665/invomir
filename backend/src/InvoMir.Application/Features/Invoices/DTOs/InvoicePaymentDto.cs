namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoicePaymentDto(
    Guid InvoiceId,
    Guid PaymentId,
    string Status,
    decimal Amount,
    string Currency,
    string Method,
    DateTime PaidAt,
    int CancelledReminderJobCount);
