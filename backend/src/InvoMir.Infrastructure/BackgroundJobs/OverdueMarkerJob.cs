using Hangfire;
using InvoMir.Application.Features.Notifications;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class OverdueMarkerJob(
    IAppDbContext context,
    INotificationService notificationService,
    ILogger<OverdueMarkerJob> logger)
{
    [Queue(BackgroundJobQueues.Critical)]
    [AutomaticRetry(Attempts = 3)]
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var invoices = await context.Invoices
            .IgnoreQueryFilters()
            .Where(invoice =>
                !invoice.IsDeleted &&
                invoice.DueDate < today &&
                (invoice.Status == InvoiceConstants.Statuses.Sent ||
                    invoice.Status == InvoiceConstants.Statuses.Viewed))
            .OrderBy(invoice => invoice.DueDate)
            .Take(500)
            .ToListAsync(cancellationToken);

        if (invoices.Count == 0)
            return;

        foreach (var invoice in invoices)
            invoice.MarkOverdue();

        await context.SaveChangesAsync(cancellationToken);

        foreach (var invoice in invoices)
        {
            await NotificationEventPublisher.CreateForRolesAsync(
                notificationService,
                invoice.TenantId,
                NotificationEventPublisher.BillingOperatorRoles,
                "Invoice overdue",
                $"{invoice.InvoiceNumber} is now overdue.",
                NotificationConstants.Types.Invoice,
                NotificationConstants.Priorities.High,
                $"/app/invoices/{invoice.Id}",
                new
                {
                    invoice.Id,
                    invoice.InvoiceNumber,
                    invoice.DueDate,
                    invoice.Total,
                    invoice.Currency
                },
                cancellationToken);
        }

        logger.LogInformation("Marked {InvoiceCount} invoices as overdue.", invoices.Count);
    }
}
