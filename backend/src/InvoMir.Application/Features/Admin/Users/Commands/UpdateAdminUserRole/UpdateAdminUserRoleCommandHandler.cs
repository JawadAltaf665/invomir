using InvoMir.Application.Features.Admin.DTOs;

namespace InvoMir.Application.Features.Admin.Users.Commands.UpdateAdminUserRole;

public sealed class UpdateAdminUserRoleCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    IClientContext clientContext,
    IAuditService auditService,
    IRolePermissionProvider rolePermissionProvider)
    : IRequestHandler<UpdateAdminUserRoleCommand, AdminUserRoleUpdateDto>
{
    public async Task<AdminUserRoleUpdateDto> Handle(
        UpdateAdminUserRoleCommand request,
        CancellationToken cancellationToken)
    {
        var adminUserId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        if (request.Id == adminUserId)
            throw new BadRequestException("You cannot change your own admin role.");

        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentUser =>
                currentUser.Id == request.Id &&
                !currentUser.IsDeleted,
                cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(User), request.Id);

        var role = request.Role.Trim().ToLowerInvariant();
        if (user.Role == role)
        {
            return new AdminUserRoleUpdateDto(
                user.Id,
                user.TenantId,
                user.Role,
                rolePermissionProvider.GetPermissionsForRole(user.Role));
        }

        var oldValues = ToAuditSnapshot(user);
        user.UpdateRole(role);

        var refreshTokens = await context.RefreshTokens
            .IgnoreQueryFilters()
            .Where(token => token.UserId == user.Id && !token.IsRevoked)
            .ToListAsync(cancellationToken);

        foreach (var refreshToken in refreshTokens)
            refreshToken.Revoke();

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            user.Id,
            AuditConstants.Actions.RoleOverridden,
            user.TenantId,
            adminUserId,
            oldValues,
            ToAuditSnapshot(user, refreshTokens.Count),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return new AdminUserRoleUpdateDto(
            user.Id,
            user.TenantId,
            user.Role,
            rolePermissionProvider.GetPermissionsForRole(user.Role));
    }

    private static object ToAuditSnapshot(User user)
    {
        return new
        {
            user.Id,
            user.Email,
            user.Role,
            user.IsActive
        };
    }

    private static object ToAuditSnapshot(User user, int revokedRefreshTokenCount)
    {
        return new
        {
            user.Id,
            user.Email,
            user.Role,
            user.IsActive,
            RevokedRefreshTokens = revokedRefreshTokenCount
        };
    }
}
