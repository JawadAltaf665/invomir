namespace InvoMir.API.Authorization;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true, Inherited = true)]
public sealed class RequirePermissionAttribute : AuthorizeAttribute
{
    public RequirePermissionAttribute(string permission)
    {
        if (string.IsNullOrWhiteSpace(permission))
            throw new ArgumentException("Permission is required.", nameof(permission));

        var normalizedPermission = permission.Trim();
        if (!Permissions.IsKnown(normalizedPermission))
            throw new ArgumentException($"Unknown permission '{permission}'.", nameof(permission));

        Policy = AuthConstants.Policies.PermissionPrefix + normalizedPermission;
    }
}
