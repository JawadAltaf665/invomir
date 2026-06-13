using Hangfire;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class ReminderScannerJob(
    IAppDbContext context,
    IInvoiceReminderJobService invoiceReminderJobService,
    ILogger<ReminderScannerJob> logger)
{
    [Queue(BackgroundJobQueues.Maintenance)]
    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var invoiceIds = await context.Invoices
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(invoice =>
                !invoice.IsDeleted &&
                invoice.RemindersEnabled &&
                invoice.PaymentLinkToken != null &&
                (invoice.Status == InvoiceConstants.Statuses.Sent ||
                    invoice.Status == InvoiceConstants.Statuses.Viewed ||
                    invoice.Status == InvoiceConstants.Statuses.Overdue))
            .OrderBy(invoice => invoice.DueDate)
            .Select(invoice => new { invoice.Id, invoice.DueDate })
            .Take(500)
            .ToListAsync(cancellationToken);

        var scheduledCount = 0;
        foreach (var invoice in invoiceIds)
        {
            var scheduled = await invoiceReminderJobService.ScheduleForInvoiceAsync(
                invoice.Id,
                invoice.DueDate,
                cancellationToken);

            scheduledCount += scheduled.Count;
        }

        if (scheduledCount > 0)
            logger.LogInformation("Reminder scanner scheduled {ReminderCount} reminder jobs.", scheduledCount);
    }
}
