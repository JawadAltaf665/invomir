using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications.Queries.GetUnreadNotifications;

public sealed record GetUnreadNotificationsQuery(int Limit) : IRequest<IReadOnlyList<NotificationDto>>;
