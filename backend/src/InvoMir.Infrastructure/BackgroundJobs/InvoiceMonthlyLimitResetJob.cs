using Hangfire;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class InvoiceMonthlyLimitResetJob(ILogger<InvoiceMonthlyLimitResetJob> logger)
{
    [Queue(BackgroundJobQueues.Maintenance)]
    [AutomaticRetry(Attempts = 1)]
    public Task ExecuteAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        logger.LogInformation(
            "Invoice monthly limits are enforced from invoice CreationTime, so no persisted monthly counter reset is required.");

        return Task.CompletedTask;
    }
}
