namespace InvoMir.Application.Features.Notifications.Commands.DeleteNotification;

public sealed record DeleteNotificationCommand(Guid Id) : IRequest<bool>;
