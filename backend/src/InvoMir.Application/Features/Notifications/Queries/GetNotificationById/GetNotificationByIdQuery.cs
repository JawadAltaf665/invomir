using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications.Queries.GetNotificationById;

public sealed record GetNotificationByIdQuery(Guid Id) : IRequest<NotificationDto>;
