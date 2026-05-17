namespace InvoMir.Infrastructure.Services;

public sealed class InvoiceReminderJobService : IInvoiceReminderJobService
{
    public Task<int> CancelPendingAsync(Guid invoiceId, CancellationToken cancellationToken)
    {
        if (invoiceId == Guid.Empty)
            throw new ArgumentException("Invoice id is required.", nameof(invoiceId));

        return Task.FromResult(0);
    }
}
