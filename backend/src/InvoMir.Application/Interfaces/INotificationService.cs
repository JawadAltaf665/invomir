using InvoMir.Application.Features.Notifications;

namespace InvoMir.Application.Interfaces;

public interface INotificationService
{
    Task<int> CreateAsync(CreateNotificationInput input, CancellationToken cancellationToken);

    Task<int> CreateForUserAsync(
        Guid tenantId,
        Guid userId,
        string title,
        string message,
        string type,
        string priority,
        string? actionUrl,
        object? metadata,
        CancellationToken cancellationToken);

    Task<int> CreateForRoleAsync(
        Guid tenantId,
        string roleId,
        string title,
        string message,
        string type,
        string priority,
        string? actionUrl,
        object? metadata,
        CancellationToken cancellationToken);

    Task<int> CreateBroadcastAsync(
        Guid tenantId,
        string title,
        string message,
        string type,
        string priority,
        string? actionUrl,
        object? metadata,
        CancellationToken cancellationToken);

    Task<int> GetUnreadCountAsync(CancellationToken cancellationToken);
    Task MarkReadAsync(Guid notificationId, CancellationToken cancellationToken);
    Task<int> MarkAllReadAsync(CancellationToken cancellationToken);
}
