using MediatR;
using Microsoft.EntityFrameworkCore;
using InvoMir.Application.Features.Notifications;
using InvoMir.Shared.Constants;

namespace InvoMir.Application.Features.Admin.Notifications;

public sealed class SendAdminSubscriptionNotificationHandler(
    IAppDbContext context,
    INotificationService notificationService) : INotificationHandler<UserSubscribedNotification>
{
    public async Task Handle(UserSubscribedNotification notification, CancellationToken cancellationToken)
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
                "New Plan Subscription",
                $"User {notification.UserName} ({notification.UserEmail}) just subscribed to the {notification.Plan} plan.",
                NotificationConstants.Types.Subscription,
                NotificationConstants.Priorities.High,
                $"/admin/users/{notification.UserId}",
                new { notification.UserId, notification.TenantId, notification.Plan },
                cancellationToken);
        }
    }
}
