namespace InvoMir.Application.Features.Team.Commands.RemoveTeamMember;

public sealed class RemoveTeamMemberCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<RemoveTeamMemberCommand, bool>
{
    public async Task<bool> Handle(
        RemoveTeamMemberCommand request,
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

        if (member.Role == AuthConstants.Roles.Owner)
            throw new BadRequestException("Workspace owners cannot be removed.");

        var oldValues = ToAuditSnapshot(member);
        var refreshTokens = await context.RefreshTokens
            .Where(token => token.UserId == member.Id && !token.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var refreshToken in refreshTokens)
            refreshToken.Revoke();

        context.Users.Remove(member);
        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            member.Id,
            AuditConstants.Actions.TeamMemberRemoved,
            tenantContext.TenantId,
            owner.Id,
            oldValues: oldValues,
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        return true;
    }

    private static object ToAuditSnapshot(User user)
    {
        return new
        {
            user.Email,
            user.FirstName,
            user.LastName,
            user.Role,
            user.IsActive
        };
    }
}
