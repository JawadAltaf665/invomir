namespace InvoMir.Application.Interfaces;

public interface IInvoiceReminderJobService
{
    Task<IReadOnlyList<DateTime>> ScheduleForInvoiceAsync(Guid invoiceId, DateOnly dueDate, CancellationToken cancellationToken);
    Task<int> CancelPendingAsync(Guid invoiceId, CancellationToken cancellationToken);
}
