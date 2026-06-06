using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications.Queries.GetUnreadNotifications;

public sealed class GetUnreadNotificationsQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : IRequestHandler<GetUnreadNotificationsQuery, IReadOnlyList<NotificationDto>>
{
    private const int DefaultLimit = 10;
    private const int MaxLimit = 50;

    public async Task<IReadOnlyList<NotificationDto>> Handle(
        GetUnreadNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);
        var notifications = await context.Notifications
            .AsNoTracking()
            .Where(notification => notification.UserId == userId && !notification.IsRead)
            .OrderByDescending(notification => notification.CreationTime)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return notifications
            .Select(NotificationMapper.ToDto)
            .ToList();
    }
}
