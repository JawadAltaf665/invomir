namespace InvoMir.Application.Features.Team.Commands.CancelTeamInvitation;

public sealed class CancelTeamInvitationCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<CancelTeamInvitationCommand, bool>
{
    public async Task<bool> Handle(
        CancelTeamInvitationCommand request,
        CancellationToken cancellationToken)
    {
        var owner = await TeamAccess.GetCurrentActiveUserAsync(context, currentUserContext, cancellationToken);
        TeamAccess.EnsureOwner(owner);

        var invitation = await context.TeamInvitations
            .FirstOrDefaultAsync(currentInvitation => currentInvitation.Id == request.Id, cancellationToken);

        if (invitation is null)
            throw new NotFoundException(nameof(TeamInvitation), request.Id);

        if (invitation.Status != TeamConstants.InvitationStatuses.Pending)
            throw new BadRequestException("Only pending invitations can be cancelled.");

        var oldValues = ToAuditSnapshot(invitation);
        invitation.Cancel(DateTime.UtcNow);
        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.TeamInvitation,
            invitation.Id,
            AuditConstants.Actions.TeamInvitationCancelled,
            tenantContext.TenantId,
            owner.Id,
            oldValues,
            ToAuditSnapshot(invitation),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return true;
    }

    private static object ToAuditSnapshot(TeamInvitation invitation)
    {
        return new
        {
            invitation.Email,
            invitation.Role,
            invitation.Status,
            invitation.ExpiresAt,
            invitation.AcceptedAt
        };
    }
}
