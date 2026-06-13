namespace InvoMir.Application.Features.Team;

public static class TeamInvitationLifecycle
{
    public static async Task<int> CancelPendingInvitationsForPlanAsync(
        IAppDbContext context,
        Guid tenantId,
        string plan,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        if (plan == AuthConstants.Plans.Business)
            return 0;

        var invitations = await context.TeamInvitations
            .IgnoreQueryFilters()
            .Where(invitation =>
                invitation.TenantId == tenantId &&
                !invitation.IsDeleted &&
                invitation.Status == TeamConstants.InvitationStatuses.Pending)
            .ToListAsync(cancellationToken);

        foreach (var invitation in invitations)
            invitation.Cancel(utcNow);

        return invitations.Count;
    }
}
