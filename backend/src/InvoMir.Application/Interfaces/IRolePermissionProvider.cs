namespace InvoMir.Application.Interfaces;

public interface IRolePermissionProvider
{
    IReadOnlyCollection<string> GetPermissionsForRole(string role);
}
