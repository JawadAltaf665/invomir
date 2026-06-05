using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications.Commands.MarkNotificationAsRead;

public sealed record MarkNotificationAsReadCommand(Guid Id) : IRequest<NotificationDto>;
