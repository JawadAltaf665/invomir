using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications.Queries.GetUnreadCount;

public sealed record GetUnreadCountQuery : IRequest<UnreadNotificationCountDto>;
