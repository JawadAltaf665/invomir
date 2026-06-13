using Hangfire;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class TokenCleanupJob(
    IAppDbContext context,
    ILogger<TokenCleanupJob> logger)
{
    [Queue(BackgroundJobQueues.Maintenance)]
    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;
        var revokedCutoff = utcNow.AddDays(-30);

        var refreshTokensDeleted = await context.RefreshTokens
            .IgnoreQueryFilters()
            .Where(token =>
                token.ExpiresAt <= utcNow ||
                (token.IsRevoked && token.RevokedAt <= revokedCutoff))
            .ExecuteDeleteAsync(cancellationToken);

        var passwordResetTokensDeleted = await context.PasswordResetTokens
            .IgnoreQueryFilters()
            .Where(token =>
                token.ExpiresAt <= utcNow ||
                token.IsUsed)
            .ExecuteDeleteAsync(cancellationToken);

        var emailVerificationTokensDeleted = await context.EmailVerificationTokens
            .IgnoreQueryFilters()
            .Where(token =>
                token.ExpiresAt <= utcNow ||
                token.IsUsed)
            .ExecuteDeleteAsync(cancellationToken);

        logger.LogInformation(
            "Token cleanup deleted {RefreshTokenCount} refresh tokens, {PasswordResetTokenCount} password reset tokens, and {EmailVerificationTokenCount} email verification tokens.",
            refreshTokensDeleted,
            passwordResetTokensDeleted,
            emailVerificationTokensDeleted);
    }
}
