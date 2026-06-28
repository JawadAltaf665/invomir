using MediatR;
using Microsoft.EntityFrameworkCore;
using InvoMir.Application.Features.Notifications;
using InvoMir.Shared.Constants;

namespace InvoMir.Application.Features.Admin.Notifications;

public sealed class SendAdminUserRegistrationNotificationHandler(
    IAppDbContext context,
    INotificationService notificationService) : INotificationHandler<UserRegisteredNotification>
{
    public async Task Handle(UserRegisteredNotification notification, CancellationToken cancellationToken)
    {
        var systemAdmins = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(u => u.Role == AuthConstants.Roles.SystemAdmin && u.IsActive && !u.IsDeleted)
            .ToListAsync(cancellationToken);

        if (systemAdmins.Count == 0)
        {
            return;
        }

        foreach (var admin in systemAdmins)
        {
            await notificationService.CreateForUserAsync(
                admin.TenantId,
                admin.Id,
                "New User Registration",
                $"User {notification.Email} ({notification.BusinessName}) registered via {notification.AuthProvider}.",
                NotificationConstants.Types.System,
                NotificationConstants.Priorities.Medium,
                $"/admin/users/{notification.UserId}",
                new { notification.UserId, notification.TenantId, notification.Email },
                cancellationToken);
        }
    }
}
