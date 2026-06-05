namespace InvoMir.Application.Features.Notifications.Commands.DeleteNotification;

public sealed class DeleteNotificationCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : IRequestHandler<DeleteNotificationCommand, bool>
{
    public async Task<bool> Handle(
        DeleteNotificationCommand request,
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

        context.Notifications.Remove(notification);
        await context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
