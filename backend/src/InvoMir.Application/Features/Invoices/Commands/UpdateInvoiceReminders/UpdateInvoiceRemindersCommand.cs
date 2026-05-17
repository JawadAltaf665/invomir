namespace InvoMir.Application.Features.Invoices.Commands.UpdateInvoiceReminders;

public sealed record UpdateInvoiceRemindersCommand : IRequest<InvoiceReminderSettingsDto>
{
    public Guid Id { get; init; }
    public bool? Enabled { get; init; }
}
