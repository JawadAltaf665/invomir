using System.Text.Json;

namespace InvoMir.Application.Features.Notifications;

public sealed class NotificationService(
    IAppDbContext context,
    ICurrentUserContext currentUserContext)
    : INotificationService
{
    private static readonly JsonSerializerOptions MetadataJsonOptions = new(JsonSerializerDefaults.Web);

    public Task<int> CreateAsync(CreateNotificationInput input, CancellationToken cancellationToken)
    {
        var target = NormalizeTarget(input.Target);

        return target switch
        {
            NotificationConstants.Targets.User => input.UserId.HasValue
                ? CreateForUserAsync(
                    input.TenantId,
                    input.UserId.Value,
                    input.Title,
                    input.Message,
                    input.Type,
                    input.Priority,
                    input.ActionUrl,
                    input.Metadata,
                    cancellationToken)
                : throw new BadRequestException("User id is required for user notifications."),
            NotificationConstants.Targets.Role => !string.IsNullOrWhiteSpace(input.RoleId)
                ? CreateForRoleAsync(
                    input.TenantId,
                    input.RoleId,
                    input.Title,
                    input.Message,
                    input.Type,
                    input.Priority,
                    input.ActionUrl,
                    input.Metadata,
                    cancellationToken)
                : throw new BadRequestException("Role id is required for role notifications."),
            NotificationConstants.Targets.Broadcast => CreateBroadcastAsync(
                input.TenantId,
                input.Title,
                input.Message,
                input.Type,
                input.Priority,
                input.ActionUrl,
                input.Metadata,
                cancellationToken),
            _ => throw new BadRequestException("Notification target is not supported.")
        };
    }

    public async Task<int> CreateForUserAsync(
        Guid tenantId,
        Guid userId,
        string title,
        string message,
        string type,
        string priority,
        string? actionUrl,
        object? metadata,
        CancellationToken cancellationToken)
    {
        await EnsureUserCanReceiveAsync(tenantId, userId, cancellationToken);

        return await CreateForRecipientsAsync(
            tenantId,
            [new NotificationRecipient(userId, null, NotificationConstants.Targets.User)],
            title,
            message,
            type,
            priority,
            actionUrl,
            metadata,
            cancellationToken);
    }

    public async Task<int> CreateForRoleAsync(
        Guid tenantId,
        string roleId,
        string title,
        string message,
        string type,
        string priority,
        string? actionUrl,
        object? metadata,
        CancellationToken cancellationToken)
    {
        var normalizedRoleId = NormalizeRoleId(roleId);
        var recipients = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user =>
                user.TenantId == tenantId &&
                !user.IsDeleted &&
                user.IsActive &&
                user.Role == normalizedRoleId)
            .Select(user => new NotificationRecipient(
                user.Id,
                normalizedRoleId,
                NotificationConstants.Targets.Role))
            .ToListAsync(cancellationToken);

        return await CreateForRecipientsAsync(
            tenantId,
            recipients,
            title,
            message,
            type,
            priority,
            actionUrl,
            metadata,
            cancellationToken);
    }

    public async Task<int> CreateBroadcastAsync(
        Guid tenantId,
        string title,
        string message,
        string type,
        string priority,
        string? actionUrl,
        object? metadata,
        CancellationToken cancellationToken)
    {
        var recipients = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user =>
                user.TenantId == tenantId &&
                !user.IsDeleted &&
                user.IsActive)
            .Select(user => new NotificationRecipient(
                user.Id,
                null,
                NotificationConstants.Targets.Broadcast))
            .ToListAsync(cancellationToken);

        return await CreateForRecipientsAsync(
            tenantId,
            recipients,
            title,
            message,
            type,
            priority,
            actionUrl,
            metadata,
            cancellationToken);
    }

    public async Task<int> GetUnreadCountAsync(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();

        return await context.Notifications
            .AsNoTracking()
            .CountAsync(
                notification => notification.UserId == userId && !notification.IsRead,
                cancellationToken);
    }

    public async Task MarkReadAsync(Guid notificationId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var notification = await context.Notifications
            .FirstOrDefaultAsync(
                currentNotification =>
                    currentNotification.Id == notificationId &&
                    currentNotification.UserId == userId,
                cancellationToken);

        if (notification is null)
            throw new NotFoundException(nameof(Notification), notificationId);

        notification.MarkRead(DateTime.UtcNow);
        await context.SaveChangesAsync(cancellationToken);
    }

    public async Task<int> MarkAllReadAsync(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var notifications = await context.Notifications
            .Where(notification => notification.UserId == userId && !notification.IsRead)
            .ToListAsync(cancellationToken);

        foreach (var notification in notifications)
            notification.MarkRead(DateTime.UtcNow);

        if (notifications.Count == 0)
            return 0;

        await context.SaveChangesAsync(cancellationToken);
        return notifications.Count;
    }

    private async Task<int> CreateForRecipientsAsync(
        Guid tenantId,
        IReadOnlyCollection<NotificationRecipient> recipients,
        string title,
        string message,
        string type,
        string priority,
        string? actionUrl,
        object? metadata,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new BadRequestException("Tenant id is required.");

        if (recipients.Count == 0)
            return 0;

        var metadataJson = SerializeMetadata(metadata);
        foreach (var recipient in recipients)
        {
            context.Notifications.Add(Notification.Create(
                tenantId,
                recipient.UserId,
                title,
                message,
                type,
                priority,
                recipient.Target,
                recipient.RoleId,
                actionUrl,
                metadataJson));
        }

        await context.SaveChangesAsync(cancellationToken);
        return recipients.Count;
    }

    private async Task EnsureUserCanReceiveAsync(
        Guid tenantId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var exists = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(
                user =>
                    user.Id == userId &&
                    user.TenantId == tenantId &&
                    !user.IsDeleted &&
                    user.IsActive,
                cancellationToken);

        if (!exists)
            throw new NotFoundException(nameof(User), userId);
    }

    private Guid GetCurrentUserId()
    {
        return currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");
    }

    private static string NormalizeTarget(string target)
    {
        var normalizedTarget = target.Trim().ToLowerInvariant();
        if (!NotificationConstants.Targets.All.Contains(normalizedTarget))
            throw new BadRequestException("Notification target is not supported.");

        return normalizedTarget;
    }

    private static string NormalizeRoleId(string roleId)
    {
        var normalizedRoleId = roleId.Trim().ToLowerInvariant();
        if (!NotificationConstants.SupportedRoleIds.Contains(normalizedRoleId))
            throw new BadRequestException("Notification role target is not supported.");

        return normalizedRoleId;
    }

    private static string? SerializeMetadata(object? metadata)
    {
        return metadata is null
            ? null
            : JsonSerializer.Serialize(metadata, MetadataJsonOptions);
    }

    private sealed record NotificationRecipient(
        Guid UserId,
        string? RoleId,
        string Target);
}
