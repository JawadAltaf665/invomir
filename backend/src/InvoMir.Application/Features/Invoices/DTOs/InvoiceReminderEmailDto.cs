namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceReminderEmailDto(
    Guid InvoiceId,
    string ToEmail,
    string ClientName,
    string InvoiceNumber,
    string BusinessName,
    string Currency,
    decimal Total,
    DateOnly DueDate,
    string PaymentLinkToken,
    string ReminderType,
    Guid TenantId,
    Guid UserId);
