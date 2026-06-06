using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications.Queries.GetNotifications;

public sealed record GetNotificationsQuery(
    string? Type,
    string? Status,
    string? Priority,
    string? Search,
    int Page,
    int Limit)
    : IRequest<PagedResult<NotificationDto>>;
