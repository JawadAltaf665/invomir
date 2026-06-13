using Hangfire;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class StripeConnectStateCleanupJob(
    IAppDbContext context,
    ILogger<StripeConnectStateCleanupJob> logger)
{
    [Queue(BackgroundJobQueues.Maintenance)]
    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;
        var deletedCount = await context.StripeConnectStates
            .IgnoreQueryFilters()
            .Where(state =>
                state.ExpiresAt <= utcNow ||
                state.UsedAt != null)
            .ExecuteDeleteAsync(cancellationToken);

        if (deletedCount > 0)
            logger.LogInformation("Stripe Connect state cleanup deleted {StateCount} state rows.", deletedCount);
    }
}
