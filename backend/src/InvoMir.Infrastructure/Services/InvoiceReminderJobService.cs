using Hangfire;
using InvoMir.Infrastructure.BackgroundJobs;

namespace InvoMir.Infrastructure.Services;

public sealed class InvoiceReminderJobService(
    IAppDbContext context,
    IBackgroundJobClient backgroundJobClient,
    ILogger<InvoiceReminderJobService> logger)
    : IInvoiceReminderJobService
{
    private static readonly TimeOnly ReminderTimeUtc = new(9, 0);

    public async Task<IReadOnlyList<DateTime>> ScheduleForInvoiceAsync(
        Guid invoiceId,
        DateOnly dueDate,
        CancellationToken cancellationToken)
    {
        if (invoiceId == Guid.Empty)
            throw new ArgumentException("Invoice id is required.", nameof(invoiceId));

        cancellationToken.ThrowIfCancellationRequested();

        var invoice = await context.Invoices
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(currentInvoice =>
                currentInvoice.Id == invoiceId &&
                !currentInvoice.IsDeleted,
                cancellationToken);

        if (invoice is null || !invoice.CanScheduleReminders())
            return [];

        var utcNow = DateTime.UtcNow;
        var reminderPlans = BuildReminderPlans(dueDate)
            .Where(plan => plan.ScheduledForUtc > utcNow)
            .ToArray();

        if (reminderPlans.Length == 0)
            return [];

        var reminderTypes = reminderPlans.Select(plan => plan.Type).ToArray();
        var existingTypes = await context.Reminders
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(reminder =>
                reminder.InvoiceId == invoice.Id &&
                reminder.TenantId == invoice.TenantId &&
                !reminder.IsDeleted &&
                reminderTypes.Contains(reminder.Type) &&
                reminder.Status == ReminderConstants.Statuses.Pending)
            .Select(reminder => reminder.Type)
            .ToListAsync(cancellationToken);

        var existingTypeSet = existingTypes.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var scheduledDates = new List<DateTime>();

        foreach (var plan in reminderPlans)
        {
            if (existingTypeSet.Contains(plan.Type))
                continue;

            var reminder = Reminder.Create(
                invoice.TenantId,
                invoice.Id,
                invoice.UserId,
                plan.Type,
                plan.ScheduledForUtc);

            context.Reminders.Add(reminder);
            await context.SaveChangesAsync(cancellationToken);

            var jobId = backgroundJobClient.Schedule<InvoiceReminderEmailJob>(
                job => job.ExecuteAsync(reminder.Id, CancellationToken.None),
                reminder.ScheduledForUtc);

            reminder.AttachHangfireJob(jobId);
            await context.SaveChangesAsync(cancellationToken);
            scheduledDates.Add(reminder.ScheduledForUtc);
        }

        if (scheduledDates.Count > 0)
        {
            logger.LogInformation(
                "Scheduled {ReminderCount} invoice reminders for invoice {InvoiceId}.",
                scheduledDates.Count,
                invoice.Id);
        }

        return scheduledDates;
    }

    public async Task<int> CancelPendingAsync(Guid invoiceId, CancellationToken cancellationToken)
    {
        if (invoiceId == Guid.Empty)
            throw new ArgumentException("Invoice id is required.", nameof(invoiceId));

        cancellationToken.ThrowIfCancellationRequested();

        var reminders = await context.Reminders
            .IgnoreQueryFilters()
            .Where(reminder =>
                reminder.InvoiceId == invoiceId &&
                !reminder.IsDeleted &&
                reminder.Status == ReminderConstants.Statuses.Pending)
            .ToListAsync(cancellationToken);

        if (reminders.Count == 0)
            return 0;

        var utcNow = DateTime.UtcNow;
        foreach (var reminder in reminders)
        {
            if (!string.IsNullOrWhiteSpace(reminder.HangfireJobId))
                backgroundJobClient.Delete(reminder.HangfireJobId);

            reminder.MarkCancelled(utcNow);
        }

        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Cancelled {ReminderCount} pending invoice reminders for invoice {InvoiceId}.",
            reminders.Count,
            invoiceId);

        return reminders.Count;
    }

    private static IEnumerable<ReminderPlan> BuildReminderPlans(DateOnly dueDate)
    {
        var dueDateTime = dueDate.ToDateTime(ReminderTimeUtc, DateTimeKind.Utc);

        yield return new ReminderPlan(ReminderConstants.Types.DueSoon, dueDateTime.AddDays(-3));
        yield return new ReminderPlan(ReminderConstants.Types.OneDayOverdue, dueDateTime.AddDays(1));
        yield return new ReminderPlan(ReminderConstants.Types.SevenDaysOverdue, dueDateTime.AddDays(7));
    }

    private sealed record ReminderPlan(string Type, DateTime ScheduledForUtc);
}
