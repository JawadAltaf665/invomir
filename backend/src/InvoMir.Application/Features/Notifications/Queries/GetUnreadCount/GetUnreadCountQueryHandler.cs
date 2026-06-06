using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications.Queries.GetUnreadCount;

public sealed class GetUnreadCountQueryHandler(INotificationService notificationService)
    : IRequestHandler<GetUnreadCountQuery, UnreadNotificationCountDto>
{
    public async Task<UnreadNotificationCountDto> Handle(
        GetUnreadCountQuery request,
        CancellationToken cancellationToken)
    {
        var count = await notificationService.GetUnreadCountAsync(cancellationToken);
        return new UnreadNotificationCountDto(count);
    }
}
