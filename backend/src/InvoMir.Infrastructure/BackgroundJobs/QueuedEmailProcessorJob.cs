using Hangfire;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class QueuedEmailProcessorJob(
    IAppDbContext context,
    ISmtpEmailSender smtpEmailSender,
    ILogger<QueuedEmailProcessorJob> logger)
{
    private const int BatchSize = 20;

    [Queue(BackgroundJobQueues.Email)]
    [AutomaticRetry(Attempts = 0)]
    [DisableConcurrentExecution(timeoutInSeconds: 300)]
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;
        var emails = await context.QueuedEmails
            .IgnoreQueryFilters()
            .Where(email =>
                !email.IsDeleted &&
                email.Status == QueuedEmailStatus.Pending &&
                email.RetryCount < email.MaxRetryCount &&
                (email.ScheduledAt == null || email.ScheduledAt <= utcNow))
            .OrderBy(email => email.ScheduledAt ?? email.CreationTime)
            .ThenBy(email => email.CreationTime)
            .Take(BatchSize)
            .ToListAsync(cancellationToken);

        foreach (var email in emails)
            await ProcessEmailAsync(email, cancellationToken);
    }

    private async Task ProcessEmailAsync(QueuedEmail email, CancellationToken cancellationToken)
    {
        try
        {
            email.MarkProcessing(DateTime.UtcNow);
            await context.SaveChangesAsync(cancellationToken);

            await smtpEmailSender.SendAsync(email, cancellationToken);

            email.MarkSent(DateTime.UtcNow);
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            email.MarkFailed(BuildSafeErrorMessage(exception), DateTime.UtcNow);
            await context.SaveChangesAsync(cancellationToken);

            logger.LogWarning(
                exception,
                "Queued email {QueuedEmailId} delivery failed. Retry {RetryCount}/{MaxRetryCount}.",
                email.Id,
                email.RetryCount,
                email.MaxRetryCount);
        }
    }

    private static string BuildSafeErrorMessage(Exception exception)
    {
        return exception switch
        {
            InvalidOperationException => exception.Message,
            FormatException => "Queued email address or attachment format is invalid.",
            _ => "SMTP delivery failed."
        };
    }
}
