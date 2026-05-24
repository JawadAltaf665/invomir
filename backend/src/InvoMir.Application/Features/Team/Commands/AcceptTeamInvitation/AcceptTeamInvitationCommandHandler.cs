using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team.Commands.AcceptTeamInvitation;

public sealed class AcceptTeamInvitationCommandHandler(
    IAppDbContext context,
    IPasswordHasher passwordHasher,
    IEmailService emailService,
    IAuditService auditService)
    : IRequestHandler<AcceptTeamInvitationCommand, TeamInvitationAcceptedDto>
{
    public async Task<TeamInvitationAcceptedDto> Handle(
        AcceptTeamInvitationCommand request,
        CancellationToken cancellationToken)
    {
        var tokenHash = TeamInvitationToken.Hash(request.Token);
        var invitation = await context.TeamInvitations
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentInvitation =>
                currentInvitation.TokenHash == tokenHash &&
                !currentInvitation.IsDeleted,
                cancellationToken);

        if (invitation is null)
            throw new NotFoundException(nameof(TeamInvitation), "token");

        var utcNow = DateTime.UtcNow;
        await EnsureInvitationCanBeAcceptedAsync(invitation, utcNow, cancellationToken);
        await TeamSeatPolicy.EnsureAcceptanceCapacityAsync(context, invitation.TenantId, cancellationToken);
        await EnsureEmailCanJoinWorkspaceAsync(invitation, cancellationToken);

        var tenant = await context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentTenant =>
                currentTenant.Id == invitation.TenantId &&
                !currentTenant.IsDeleted,
                cancellationToken);

        if (tenant is null)
            throw new NotFoundException(nameof(Tenant), invitation.TenantId);

        var defaults = await GetWorkspaceDefaultsAsync(invitation.TenantId, cancellationToken);
        var member = User.CreateTeamMember(
            invitation.TenantId,
            invitation.Email,
            passwordHasher.HashPassword(request.Password),
            request.FirstName,
            request.LastName,
            invitation.Role,
            tenant.Plan,
            defaults.Currency,
            defaults.TaxPercent);

        member.VerifyEmail();
        context.Users.Add(member);

        var oldValues = ToAuditSnapshot(invitation);
        invitation.Accept(utcNow);

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.TeamInvitation,
            invitation.Id,
            AuditConstants.Actions.TeamInvitationAccepted,
            invitation.TenantId,
            member.Id,
            oldValues,
            new
            {
                invitation.Email,
                invitation.Role,
                invitation.Status,
                invitation.AcceptedAt,
                UserId = member.Id
            },
            cancellationToken: cancellationToken);

        await emailService.SendWelcomeAsync(member.Email, member.FirstName, cancellationToken);

        return new TeamInvitationAcceptedDto(
            member.Id,
            member.TenantId,
            member.Email,
            member.FirstName,
            member.LastName,
            member.Role);
    }

    private async Task EnsureInvitationCanBeAcceptedAsync(
        TeamInvitation invitation,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        if (invitation.Status == TeamConstants.InvitationStatuses.Accepted)
            throw new ConflictException("Invitation has already been accepted.");

        if (invitation.Status == TeamConstants.InvitationStatuses.Cancelled)
            throw new BadRequestException("Invitation has been cancelled.");

        if (invitation.Status == TeamConstants.InvitationStatuses.Expired ||
            invitation.ExpiresAt <= utcNow)
        {
            invitation.Expire(utcNow);
            await context.SaveChangesAsync(cancellationToken);
            throw new BadRequestException("Invitation has expired.");
        }

        if (invitation.Status != TeamConstants.InvitationStatuses.Pending)
            throw new BadRequestException("Invitation is not pending.");
    }

    private async Task EnsureEmailCanJoinWorkspaceAsync(
        TeamInvitation invitation,
        CancellationToken cancellationToken)
    {
        var existingUser = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user => user.Email == invitation.Email && !user.IsDeleted)
            .Select(user => new
            {
                user.TenantId,
                user.IsActive
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (existingUser is null)
            return;

        if (existingUser.TenantId == invitation.TenantId)
            throw new ConflictException("This email is already a member of the workspace.");

        throw new ConflictException("This email already belongs to another InvoMir workspace.");
    }

    private async Task<WorkspaceDefaults> GetWorkspaceDefaultsAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var defaults = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user =>
                user.TenantId == tenantId &&
                user.Role == AuthConstants.Roles.Owner &&
                !user.IsDeleted)
            .OrderBy(user => user.CreationTime)
            .Select(user => new WorkspaceDefaults(user.Currency, user.TaxPercent))
            .FirstOrDefaultAsync(cancellationToken);

        return defaults ?? new WorkspaceDefaults("USD", 0);
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

    private sealed record WorkspaceDefaults(string Currency, decimal TaxPercent);
}
