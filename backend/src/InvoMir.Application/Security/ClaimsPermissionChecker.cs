namespace InvoMir.Application.Security;

public sealed class ClaimsPermissionChecker : IPermissionChecker
{
    public bool HasPermission(ClaimsPrincipal user, string permission)
    {
        if (string.IsNullOrWhiteSpace(permission) ||
            user.Identity?.IsAuthenticated != true ||
            !Permissions.IsKnown(permission))
        {
            return false;
        }

        return user.Claims.Any(claim =>
            claim.Type == AuthConstants.Claims.Permission &&
            string.Equals(claim.Value, permission, StringComparison.OrdinalIgnoreCase));
    }

    public IReadOnlyCollection<string> GetPermissions(ClaimsPrincipal user)
    {
        if (user.Identity?.IsAuthenticated != true)
            return [];

        return user.Claims
            .Where(claim => claim.Type == AuthConstants.Claims.Permission)
            .Select(claim => claim.Value)
            .Where(Permissions.IsKnown)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(permission => permission, StringComparer.Ordinal)
            .ToArray();
    }
}
