namespace InvoMir.Infrastructure.Services;

public sealed class InvoiceReminderJobService : IInvoiceReminderJobService
{
    private static readonly TimeOnly ReminderTimeUtc = new(9, 0);

    public Task<IReadOnlyList<DateTime>> ScheduleForInvoiceAsync(
        Guid invoiceId,
        DateOnly dueDate,
        CancellationToken cancellationToken)
    {
        if (invoiceId == Guid.Empty)
            throw new ArgumentException("Invoice id is required.", nameof(invoiceId));

        cancellationToken.ThrowIfCancellationRequested();

        var dueDateTime = dueDate.ToDateTime(ReminderTimeUtc, DateTimeKind.Utc);
        var utcNow = DateTime.UtcNow;
        IReadOnlyList<DateTime> scheduledAtUtc =
        [
            dueDateTime.AddDays(-3),
            dueDateTime.AddDays(1),
            dueDateTime.AddDays(7)
        ];

        return Task.FromResult<IReadOnlyList<DateTime>>(
            scheduledAtUtc
                .Where(scheduledAt => scheduledAt > utcNow)
                .ToArray());
    }

    public Task<int> CancelPendingAsync(Guid invoiceId, CancellationToken cancellationToken)
    {
        if (invoiceId == Guid.Empty)
            throw new ArgumentException("Invoice id is required.", nameof(invoiceId));

        cancellationToken.ThrowIfCancellationRequested();

        return Task.FromResult(0);
    }
}
