namespace InvoMir.Application.Features.Users.Queries.GetCurrentUserPermissions;

public sealed class GetCurrentUserPermissionsQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    IRolePermissionProvider rolePermissionProvider)
    : IRequestHandler<GetCurrentUserPermissionsQuery, UserPermissionsDto>
{
    public async Task<UserPermissionsDto> Handle(
        GetCurrentUserPermissionsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var user = await context.Users
            .AsNoTracking()
            .Where(currentUser => currentUser.Id == userId)
            .Select(currentUser => new
            {
                currentUser.Id,
                currentUser.TenantId,
                currentUser.Role
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(User), userId);

        var permissions = rolePermissionProvider
            .GetPermissionsForRole(user.Role)
            .OrderBy(permission => permission, StringComparer.Ordinal)
            .ToArray();

        return new UserPermissionsDto(user.Id, user.TenantId, user.Role, permissions);
    }
}
