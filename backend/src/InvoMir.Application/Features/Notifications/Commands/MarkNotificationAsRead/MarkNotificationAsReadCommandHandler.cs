using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications.Commands.MarkNotificationAsRead;

public sealed class MarkNotificationAsReadCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : IRequestHandler<MarkNotificationAsReadCommand, NotificationDto>
{
    public async Task<NotificationDto> Handle(
        MarkNotificationAsReadCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var notification = await context.Notifications
            .FirstOrDefaultAsync(
                currentNotification =>
                    currentNotification.Id == request.Id &&
                    currentNotification.UserId == userId,
                cancellationToken);

        if (notification is null)
            throw new NotFoundException(nameof(Notification), request.Id);

        notification.MarkRead(DateTime.UtcNow);
        await context.SaveChangesAsync(cancellationToken);

        return NotificationMapper.ToDto(notification);
    }
}
