using InvoMir.Application.Features.Notifications;
using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team.Commands.InviteTeamMember;

public sealed class InviteTeamMemberCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IEmailService emailService,
    IAuditService auditService,
    INotificationService notificationService)
    : IRequestHandler<InviteTeamMemberCommand, TeamInvitationDto>
{
    public async Task<TeamInvitationDto> Handle(
        InviteTeamMemberCommand request,
        CancellationToken cancellationToken)
    {
        var owner = await TeamAccess.GetCurrentActiveUserAsync(context, currentUserContext, cancellationToken);
        TeamAccess.EnsureOwner(owner);

        var normalizedEmail = request.Email.ToLowerInvariant().Trim();
        var normalizedRole = request.Role.Trim().ToLowerInvariant();
        var utcNow = DateTime.UtcNow;

        await EnsureEmailCanBeInvitedAsync(normalizedEmail, cancellationToken);
        await EnsureNoPendingInvitationAsync(normalizedEmail, utcNow, cancellationToken);
        await TeamSeatPolicy.EnsureInvitationCapacityAsync(context, tenantContext.TenantId, utcNow, cancellationToken);

        var tenant = await context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentTenant =>
                currentTenant.Id == tenantContext.TenantId &&
                !currentTenant.IsDeleted,
                cancellationToken);

        if (tenant is null)
            throw new NotFoundException(nameof(Tenant), tenantContext.TenantId);

        var rawToken = TeamInvitationToken.Generate();
        var invitation = TeamInvitation.Create(
            tenantContext.TenantId,
            owner.Id,
            normalizedEmail,
            normalizedRole,
            TeamInvitationToken.Hash(rawToken),
            utcNow.AddDays(TeamConstants.InvitationExpiryDays));

        context.TeamInvitations.Add(invitation);
        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.TeamInvitation,
            invitation.Id,
            AuditConstants.Actions.TeamInvited,
            tenantContext.TenantId,
            owner.Id,
            newValues: ToAuditSnapshot(invitation),
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        await emailService.SendTeamInvitationAsync(
            invitation.Email,
            $"{owner.FirstName} {owner.LastName}".Trim(),
            tenant.Name,
            invitation.Role,
            rawToken,
            invitation.ExpiresAt,
            cancellationToken);

        await notificationService.CreateForRoleAsync(
            tenantContext.TenantId,
            AuthConstants.Roles.Owner,
            "Team invitation sent",
            $"{invitation.Email} was invited as {invitation.Role}.",
            NotificationConstants.Types.UserManagement,
            NotificationConstants.Priorities.Medium,
            "/app/team",
            new
            {
                invitation.Id,
                invitation.Email,
                invitation.Role,
                invitation.Status,
                invitation.ExpiresAt
            },
            cancellationToken);

        return TeamMappers.ToInvitationDto(invitation, $"{owner.FirstName} {owner.LastName}".Trim());
    }

    private async Task EnsureEmailCanBeInvitedAsync(
        string normalizedEmail,
        CancellationToken cancellationToken)
    {
        var existingUser = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user => user.Email == normalizedEmail && !user.IsDeleted)
            .Select(user => new
            {
                user.TenantId,
                user.IsActive
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (existingUser is null)
            return;

        if (existingUser.TenantId == tenantContext.TenantId)
            throw new ConflictException("This email is already a member of the workspace.");

        throw new ConflictException("This email already belongs to another InvoMir workspace.");
    }

    private async Task EnsureNoPendingInvitationAsync(
        string normalizedEmail,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var hasPendingInvitation = await context.TeamInvitations
            .AnyAsync(invitation =>
                invitation.Email == normalizedEmail &&
                invitation.Status == TeamConstants.InvitationStatuses.Pending &&
                invitation.ExpiresAt > utcNow,
                cancellationToken);

        if (hasPendingInvitation)
            throw new ConflictException("A pending invitation already exists for this email.");
    }

    private static object ToAuditSnapshot(TeamInvitation invitation)
    {
        return new
        {
            invitation.Email,
            invitation.Role,
            invitation.Status,
            invitation.ExpiresAt,
            invitation.InvitedByUserId
        };
    }
}
