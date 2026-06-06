using InvoMir.Application.Features.Notifications;
using InvoMir.Application.Features.Team.DTOs;

namespace InvoMir.Application.Features.Team.Commands.ChangeTeamMemberRole;

public sealed class ChangeTeamMemberRoleCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService,
    INotificationService notificationService)
    : IRequestHandler<ChangeTeamMemberRoleCommand, TeamMemberRoleUpdateDto>
{
    public async Task<TeamMemberRoleUpdateDto> Handle(
        ChangeTeamMemberRoleCommand request,
        CancellationToken cancellationToken)
    {
        var owner = await TeamAccess.GetCurrentActiveUserAsync(context, currentUserContext, cancellationToken);
        TeamAccess.EnsureOwner(owner);

        var member = await context.Users
            .FirstOrDefaultAsync(user =>
                user.Id == request.Id &&
                user.IsActive,
                cancellationToken);

        if (member is null)
            throw new NotFoundException(nameof(User), request.Id);

        if (member.Role == AuthConstants.Roles.SystemAdmin)
            throw new ForbiddenException("System admin users cannot be managed through team endpoints.");

        var normalizedRole = request.Role.Trim().ToLowerInvariant();
        if (member.Role == normalizedRole)
            return ToDto(member);

        await EnsureOwnerWillRemainAsync(member, normalizedRole, cancellationToken);

        var oldValues = ToAuditSnapshot(member);
        member.UpdateRole(normalizedRole);

        var refreshTokens = await context.RefreshTokens
            .Where(token => token.UserId == member.Id && !token.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var refreshToken in refreshTokens)
            refreshToken.Revoke();

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            member.Id,
            AuditConstants.Actions.TeamMemberRoleChanged,
            tenantContext.TenantId,
            owner.Id,
            oldValues,
            ToAuditSnapshot(member),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        await notificationService.CreateForUserAsync(
            tenantContext.TenantId,
            member.Id,
            "Role changed",
            $"Your workspace role is now {member.Role}.",
            NotificationConstants.Types.UserManagement,
            NotificationConstants.Priorities.High,
            "/app/team",
            new
            {
                member.Id,
                member.Email,
                member.Role
            },
            cancellationToken);

        return ToDto(member);
    }

    private async Task EnsureOwnerWillRemainAsync(
        User member,
        string requestedRole,
        CancellationToken cancellationToken)
    {
        if (member.Role != AuthConstants.Roles.Owner || requestedRole == AuthConstants.Roles.Owner)
            return;

        var hasAnotherOwner = await context.Users
            .AnyAsync(user =>
                user.Id != member.Id &&
                user.Role == AuthConstants.Roles.Owner &&
                user.IsActive,
                cancellationToken);

        if (!hasAnotherOwner)
            throw new BadRequestException("At least one workspace owner is required.");
    }

    private static TeamMemberRoleUpdateDto ToDto(User user)
    {
        return new TeamMemberRoleUpdateDto(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role);
    }

    private static object ToAuditSnapshot(User user)
    {
        return new
        {
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role
        };
    }
}
