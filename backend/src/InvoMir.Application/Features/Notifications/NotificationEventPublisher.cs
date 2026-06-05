namespace InvoMir.Application.Features.Notifications;

public static class NotificationEventPublisher
{
    public static readonly string[] WorkspaceOperatorRoles =
    [
        AuthConstants.Roles.Owner,
        AuthConstants.Roles.Admin
    ];

    public static readonly string[] BillingOperatorRoles =
    [
        AuthConstants.Roles.Owner,
        AuthConstants.Roles.Admin,
        AuthConstants.Roles.Accountant
    ];

    public static async Task CreateForRolesAsync(
        INotificationService notificationService,
        Guid tenantId,
        IEnumerable<string> roleIds,
        string title,
        string message,
        string type,
        string priority,
        string? actionUrl,
        object? metadata,
        CancellationToken cancellationToken)
    {
        foreach (var roleId in roleIds.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            await notificationService.CreateForRoleAsync(
                tenantId,
                roleId,
                title,
                message,
                type,
                priority,
                actionUrl,
                metadata,
                cancellationToken);
        }
    }
}
