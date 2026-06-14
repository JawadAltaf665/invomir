using Hangfire;
using Hangfire.PostgreSql;

namespace InvoMir.Infrastructure.BackgroundJobs;

public static class HangfireInfrastructureConfiguration
{
    public static IServiceCollection AddInvoMirBackgroundJobs(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("DefaultConnection is not configured.");

        services.AddHangfire(hangfire =>
        {
            hangfire
                .UseSimpleAssemblyNameTypeSerializer()
                .UseRecommendedSerializerSettings()
                .UsePostgreSqlStorage(
                    options => options.UseNpgsqlConnection(connectionString),
                    new PostgreSqlStorageOptions
                    {
                        UseSlidingInvisibilityTimeout = true
                    });
        });

        services.AddHangfireServer(options =>
        {
            options.ServerName = $"invomir-api-{Environment.MachineName}";
            options.Queues =
            [
                BackgroundJobQueues.Critical,
                BackgroundJobQueues.Reminders,
                BackgroundJobQueues.Email,
                BackgroundJobQueues.Maintenance,
                BackgroundJobQueues.Default
            ];
            options.WorkerCount = Math.Max(2, Math.Min(Environment.ProcessorCount * 2, 12));
        });

        return services;
    }

    public static void RegisterRecurringJobs(IRecurringJobManager recurringJobs)
    {
        recurringJobs.AddOrUpdate<ReminderScannerJob>(
            BackgroundJobIds.ReminderScanner,
            job => job.ExecuteAsync(CancellationToken.None),
            "*/10 * * * *");

        recurringJobs.AddOrUpdate<OverdueMarkerJob>(
            BackgroundJobIds.OverdueMarker,
            job => job.ExecuteAsync(CancellationToken.None),
            Cron.Hourly());

        recurringJobs.AddOrUpdate<TrialExpiryJob>(
            BackgroundJobIds.TrialExpiry,
            job => job.ExecuteAsync(CancellationToken.None),
            Cron.Daily(1));

        recurringJobs.AddOrUpdate<SubscriptionStatusSyncJob>(
            BackgroundJobIds.SubscriptionStatusSync,
            job => job.ExecuteAsync(CancellationToken.None),
            "0 */4 * * *");

        recurringJobs.AddOrUpdate<TokenCleanupJob>(
            BackgroundJobIds.TokenCleanup,
            job => job.ExecuteAsync(CancellationToken.None),
            Cron.Daily(2));

        recurringJobs.AddOrUpdate<InvitationExpiryJob>(
            BackgroundJobIds.InvitationExpiry,
            job => job.ExecuteAsync(CancellationToken.None),
            Cron.Hourly());

        recurringJobs.AddOrUpdate<StripeConnectStateCleanupJob>(
            BackgroundJobIds.StripeConnectStateCleanup,
            job => job.ExecuteAsync(CancellationToken.None),
            Cron.Daily(3));

        recurringJobs.AddOrUpdate<InvoiceMonthlyLimitResetJob>(
            BackgroundJobIds.InvoiceMonthlyLimitReset,
            job => job.ExecuteAsync(CancellationToken.None),
            Cron.Monthly(1, 0));

        recurringJobs.AddOrUpdate<UsageLimitAuditJob>(
            BackgroundJobIds.UsageLimitAudit,
            job => job.ExecuteAsync(CancellationToken.None),
            "30 4 * * *");

        recurringJobs.AddOrUpdate<QueuedEmailProcessorJob>(
            BackgroundJobIds.QueuedEmailProcessor,
            job => job.ExecuteAsync(CancellationToken.None),
            "*/1 * * * *");
    }
}

public static class BackgroundJobQueues
{
    public const string Critical = "critical";
    public const string Reminders = "reminders";
    public const string Email = "email";
    public const string Maintenance = "maintenance";
    public const string Default = "default";
}

public static class BackgroundJobIds
{
    public const string ReminderScanner = "invomir:reminder-scanner";
    public const string OverdueMarker = "invomir:overdue-marker";
    public const string TrialExpiry = "invomir:trial-expiry";
    public const string SubscriptionStatusSync = "invomir:subscription-status-sync";
    public const string TokenCleanup = "invomir:token-cleanup";
    public const string InvitationExpiry = "invomir:invitation-expiry";
    public const string StripeConnectStateCleanup = "invomir:stripe-connect-state-cleanup";
    public const string InvoiceMonthlyLimitReset = "invomir:invoice-monthly-limit-reset";
    public const string UsageLimitAudit = "invomir:usage-limit-audit";
    public const string QueuedEmailProcessor = "invomir:queued-email-processor";
}
