namespace InvoMir.Application.Features.Notifications.Commands.MarkAllNotificationsAsRead;

public sealed class MarkAllNotificationsAsReadCommandHandler(INotificationService notificationService)
    : IRequestHandler<MarkAllNotificationsAsReadCommand, int>
{
    public async Task<int> Handle(
        MarkAllNotificationsAsReadCommand request,
        CancellationToken cancellationToken)
    {
        return await notificationService.MarkAllReadAsync(cancellationToken);
    }
}
