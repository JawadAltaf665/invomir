using InvoMir.Shared.Constants;

namespace InvoMir.Domain.Entities;

public sealed class Notification : TenantEntity
{
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public string Type { get; private set; } = NotificationConstants.Types.System;
    public string Priority { get; private set; } = NotificationConstants.Priorities.Medium;
    public string Target { get; private set; } = NotificationConstants.Targets.User;
    public Guid UserId { get; private set; }
    public string? RoleId { get; private set; }
    public bool IsRead { get; private set; }
    public DateTime? ReadAt { get; private set; }
    public string? ActionUrl { get; private set; }
    public string? MetadataJson { get; private set; }

    private Notification()
    {
    }

    public static Notification Create(
        Guid tenantId,
        Guid userId,
        string title,
        string message,
        string type,
        string priority,
        string target,
        string? roleId,
        string? actionUrl,
        string? metadataJson)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));

        if (userId == Guid.Empty)
            throw new ArgumentException("User id is required.", nameof(userId));

        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Notification title is required.", nameof(title));

        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Notification message is required.", nameof(message));

        var notification = new Notification
        {
            UserId = userId,
            Title = title.Trim(),
            Message = message.Trim(),
            Type = NormalizeType(type),
            Priority = NormalizePriority(priority),
            Target = NormalizeTarget(target),
            RoleId = NormalizeOptional(roleId),
            ActionUrl = NormalizeOptional(actionUrl),
            MetadataJson = NormalizeOptional(metadataJson)
        };

        notification.SetTenant(tenantId);
        return notification;
    }

    public void MarkRead(DateTime utcNow)
    {
        if (IsRead)
            return;

        IsRead = true;
        ReadAt = utcNow;
    }

    private static string NormalizeType(string type)
    {
        var normalizedType = type.Trim().ToLowerInvariant();
        if (!NotificationConstants.Types.All.Contains(normalizedType))
            throw new ArgumentException("Notification type is not supported.", nameof(type));

        return normalizedType;
    }

    private static string NormalizePriority(string priority)
    {
        var normalizedPriority = priority.Trim().ToLowerInvariant();
        if (!NotificationConstants.Priorities.All.Contains(normalizedPriority))
            throw new ArgumentException("Notification priority is not supported.", nameof(priority));

        return normalizedPriority;
    }

    private static string NormalizeTarget(string target)
    {
        var normalizedTarget = target.Trim().ToLowerInvariant();
        if (!NotificationConstants.Targets.All.Contains(normalizedTarget))
            throw new ArgumentException("Notification target is not supported.", nameof(target));

        return normalizedTarget;
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
