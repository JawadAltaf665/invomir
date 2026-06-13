using Hangfire;
using InvoMir.Application.Features.Notifications;

namespace InvoMir.Infrastructure.BackgroundJobs;

public sealed class InvitationExpiryJob(
    IAppDbContext context,
    INotificationService notificationService,
    ILogger<InvitationExpiryJob> logger)
{
    [Queue(BackgroundJobQueues.Maintenance)]
    [AutomaticRetry(Attempts = 2)]
    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        var utcNow = DateTime.UtcNow;
        var invitations = await context.TeamInvitations
            .IgnoreQueryFilters()
            .Where(invitation =>
                !invitation.IsDeleted &&
                invitation.Status == TeamConstants.InvitationStatuses.Pending &&
                invitation.ExpiresAt <= utcNow)
            .OrderBy(invitation => invitation.ExpiresAt)
            .Take(500)
            .ToListAsync(cancellationToken);

        if (invitations.Count == 0)
            return;

        foreach (var invitation in invitations)
            invitation.Expire(utcNow);

        await context.SaveChangesAsync(cancellationToken);

        foreach (var invitation in invitations)
        {
            await notificationService.CreateForUserAsync(
                invitation.TenantId,
                invitation.InvitedByUserId,
                "Team invitation expired",
                $"Invitation for {invitation.Email} expired.",
                NotificationConstants.Types.UserManagement,
                NotificationConstants.Priorities.Low,
                "/app/team",
                new
                {
                    invitation.Id,
                    invitation.Email,
                    invitation.Role,
                    invitation.ExpiresAt
                },
                cancellationToken);
        }

        logger.LogInformation("Expired {InvitationCount} team invitations.", invitations.Count);
    }
}
