namespace InvoMir.Application.Interfaces;

public interface IPermissionChecker
{
    bool HasPermission(ClaimsPrincipal user, string permission);
    IReadOnlyCollection<string> GetPermissions(ClaimsPrincipal user);
}
