using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications.Queries.GetNotifications;

public sealed class GetNotificationsQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : IRequestHandler<GetNotificationsQuery, PagedResult<NotificationDto>>
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    public async Task<PagedResult<NotificationDto>> Handle(
        GetNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var page = request.Page < DefaultPage ? DefaultPage : request.Page;
        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);
        var query = context.Notifications
            .AsNoTracking()
            .Where(notification => notification.UserId == userId);

        query = ApplyFilters(query, request);

        var totalCount = await query.CountAsync(cancellationToken);
        var notifications = await query
            .OrderByDescending(notification => notification.CreationTime)
            .Select(notification => new NotificationSnapshot(
                notification.Id,
                notification.Title,
                notification.Message,
                notification.Type,
                notification.Priority,
                notification.Target,
                notification.UserId,
                notification.RoleId,
                notification.IsRead,
                notification.ReadAt,
                notification.CreationTime,
                notification.CreatorUserId,
                notification.ActionUrl,
                notification.MetadataJson))
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var items = notifications
            .Select(ToDto)
            .ToList();

        return new PagedResult<NotificationDto>(items, page, limit, totalCount);
    }

    private static IQueryable<Notification> ApplyFilters(
        IQueryable<Notification> query,
        GetNotificationsQuery request)
    {
        var type = NormalizeFilter(request.Type);
        if (!string.IsNullOrWhiteSpace(type) && type != NotificationConstants.Statuses.All)
            query = query.Where(notification => notification.Type == type);

        var priority = NormalizeFilter(request.Priority);
        if (!string.IsNullOrWhiteSpace(priority) && priority != NotificationConstants.Statuses.All)
            query = query.Where(notification => notification.Priority == priority);

        var status = NormalizeFilter(request.Status);
        if (status == NotificationConstants.Statuses.Read)
            query = query.Where(notification => notification.IsRead);
        else if (status == NotificationConstants.Statuses.Unread)
            query = query.Where(notification => !notification.IsRead);

        var search = request.Search?.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(notification =>
                notification.Title.ToLower().Contains(search) ||
                notification.Message.ToLower().Contains(search));
        }

        return query;
    }

    private static string? NormalizeFilter(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim().ToLowerInvariant();
    }

    private static NotificationDto ToDto(NotificationSnapshot notification)
    {
        return new NotificationDto(
            notification.Id,
            notification.Title,
            notification.Message,
            notification.Type,
            notification.Priority,
            notification.Target,
            notification.UserId,
            notification.RoleId,
            notification.IsRead,
            notification.ReadAt,
            notification.CreatedAt,
            notification.CreatedBy,
            notification.ActionUrl,
            NotificationMapper.ParseMetadata(notification.MetadataJson));
    }

    private sealed record NotificationSnapshot(
        Guid Id,
        string Title,
        string Message,
        string Type,
        string Priority,
        string Target,
        Guid UserId,
        string? RoleId,
        bool IsRead,
        DateTime? ReadAt,
        DateTime CreatedAt,
        Guid? CreatedBy,
        string? ActionUrl,
        string? MetadataJson);
}
