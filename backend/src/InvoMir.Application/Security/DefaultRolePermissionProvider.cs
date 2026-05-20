namespace InvoMir.Application.Security;

public sealed class DefaultRolePermissionProvider : IRolePermissionProvider
{
    private static readonly IReadOnlyDictionary<string, string[]> RolePermissions =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            [AuthConstants.Roles.SystemAdmin] = Permissions.All,
            [AuthConstants.Roles.Owner] = Permissions.OrganizationScoped,
            [AuthConstants.Roles.Admin] =
            [
                Permissions.Dashboard.View,
                ..Permissions.Invoice.All,
                ..Permissions.Client.All,
                ..Permissions.Payment.All,
                ..Permissions.Report.All,
                ..Permissions.AuditLog.All,
                Permissions.Subscription.View,
                Permissions.Team.Manage,
                Permissions.Settings.Manage
            ],
            [AuthConstants.Roles.Accountant] =
            [
                Permissions.Dashboard.View,
                Permissions.Invoice.View,
                Permissions.Invoice.Create,
                Permissions.Invoice.Update,
                Permissions.Invoice.Send,
                Permissions.Invoice.MarkPaid,
                Permissions.Invoice.ManageReminders,
                Permissions.Client.View,
                Permissions.Payment.View,
                Permissions.Payment.Manage,
                ..Permissions.Report.All,
                Permissions.Subscription.View
            ],
            [AuthConstants.Roles.Member] =
            [
                Permissions.Dashboard.View,
                Permissions.Invoice.View,
                Permissions.Invoice.Create,
                Permissions.Invoice.Update,
                Permissions.Invoice.Send,
                Permissions.Invoice.Duplicate,
                Permissions.Client.View,
                Permissions.Client.Create,
                Permissions.Client.Update,
                Permissions.Payment.View,
                Permissions.Report.View,
                Permissions.Subscription.View
            ],
            [AuthConstants.Roles.Viewer] =
            [
                Permissions.Dashboard.View,
                Permissions.Invoice.View,
                Permissions.Client.View,
                Permissions.Payment.View,
                Permissions.Report.View,
                Permissions.Subscription.View
            ]
        };

    public IReadOnlyCollection<string> GetPermissionsForRole(string role)
    {
        if (string.IsNullOrWhiteSpace(role))
            return [];

        return RolePermissions.TryGetValue(role.Trim(), out var permissions)
            ? permissions
            : [];
    }
}
