namespace InvoMir.Application.Features.Invoices.DTOs;

public sealed record InvoiceReminderSettingsDto(
    Guid InvoiceId,
    bool RemindersEnabled,
    int ScheduledRemindersCancelled,
    IReadOnlyList<DateTime> RemindersScheduledAtUtc);
