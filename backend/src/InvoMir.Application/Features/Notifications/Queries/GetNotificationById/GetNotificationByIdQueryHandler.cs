using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications.Queries.GetNotificationById;

public sealed class GetNotificationByIdQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : IRequestHandler<GetNotificationByIdQuery, NotificationDto>
{
    public async Task<NotificationDto> Handle(
        GetNotificationByIdQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var notification = await context.Notifications
            .AsNoTracking()
            .Where(currentNotification =>
                currentNotification.Id == request.Id &&
                currentNotification.UserId == userId)
            .FirstOrDefaultAsync(cancellationToken);

        if (notification is null)
            throw new NotFoundException(nameof(Notification), request.Id);

        return NotificationMapper.ToDto(notification);
    }
}
