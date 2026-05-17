namespace InvoMir.Application.Interfaces;

public interface IInvoiceReminderJobService
{
    Task<int> CancelPendingAsync(Guid invoiceId, CancellationToken cancellationToken);
}
