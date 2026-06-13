using Hangfire;
using InvoMir.Application.Features.Notifications;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class InvoiceReminderEmailJob(
    IAppDbContext context,
    IEmailService emailService,
    INotificationService notificationService,
    ILogger<InvoiceReminderEmailJob> logger)
{
    private const string DefaultBusinessName = "InvoMir";

    [Queue(BackgroundJobQueues.Reminders)]
    [AutomaticRetry(Attempts = 3)]
    public async Task ExecuteAsync(Guid reminderId, CancellationToken cancellationToken)
    {
        if (reminderId == Guid.Empty)
            return;

        var reminder = await context.Reminders
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentReminder =>
                currentReminder.Id == reminderId &&
                !currentReminder.IsDeleted,
                cancellationToken);

        if (reminder is null || !reminder.IsPending())
            return;

        var invoice = await context.Invoices
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentInvoice =>
                currentInvoice.Id == reminder.InvoiceId &&
                currentInvoice.TenantId == reminder.TenantId &&
                !currentInvoice.IsDeleted,
                cancellationToken);

        if (invoice is null)
        {
            reminder.MarkFailed("Invoice was not found.");
            await context.SaveChangesAsync(cancellationToken);
            return;
        }

        if (!invoice.CanScheduleReminders())
        {
            reminder.MarkCancelled(DateTime.UtcNow);
            await context.SaveChangesAsync(cancellationToken);
            return;
        }

        if (string.IsNullOrWhiteSpace(invoice.PaymentLinkToken))
        {
            reminder.MarkFailed("Invoice payment link is missing.");
            await context.SaveChangesAsync(cancellationToken);
            return;
        }

        var client = await context.Clients
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(currentClient =>
                currentClient.Id == invoice.ClientId &&
                currentClient.TenantId == invoice.TenantId &&
                !currentClient.IsDeleted,
                cancellationToken);

        if (client is null || string.IsNullOrWhiteSpace(client.Email))
        {
            reminder.MarkFailed("Client email is missing.");
            await context.SaveChangesAsync(cancellationToken);
            return;
        }

        var businessName = await context.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(tenant =>
                tenant.Id == invoice.TenantId &&
                !tenant.IsDeleted)
            .Select(tenant => tenant.Name)
            .FirstOrDefaultAsync(cancellationToken)
            ?? DefaultBusinessName;

        try
        {
            await emailService.SendInvoiceReminderAsync(
                new InvoiceReminderEmailDto(
                    invoice.Id,
                    client.Email,
                    client.Name,
                    invoice.InvoiceNumber,
                    businessName,
                    invoice.Currency,
                    invoice.Total,
                    invoice.DueDate,
                    invoice.PaymentLinkToken,
                    reminder.Type,
                    invoice.TenantId,
                    invoice.UserId),
                cancellationToken);

            reminder.MarkSent(DateTime.UtcNow);
            await context.SaveChangesAsync(cancellationToken);

            await NotificationEventPublisher.CreateForRolesAsync(
                notificationService,
                invoice.TenantId,
                NotificationEventPublisher.BillingOperatorRoles,
                "Invoice reminder sent",
                $"Reminder for {invoice.InvoiceNumber} was sent to {client.Name}.",
                NotificationConstants.Types.Reminder,
                NotificationConstants.Priorities.Low,
                $"/app/invoices/{invoice.Id}",
                new
                {
                    invoice.Id,
                    invoice.InvoiceNumber,
                    ReminderId = reminder.Id,
                    ReminderType = reminder.Type,
                    reminder.ScheduledForUtc
                },
                cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            reminder.MarkFailed("Reminder email delivery failed.");
            await context.SaveChangesAsync(cancellationToken);
            logger.LogWarning(exception, "Invoice reminder job failed for reminder {ReminderId}.", reminder.Id);
            throw;
        }
    }
}
