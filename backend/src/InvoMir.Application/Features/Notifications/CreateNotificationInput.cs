namespace InvoMir.Application.Features.Notifications;

public sealed record CreateNotificationInput(
    Guid TenantId,
    string Title,
    string Message,
    string Type,
    string Priority,
    string? ActionUrl = null,
    object? Metadata = null,
    Guid? UserId = null,
    string? RoleId = null,
    string Target = NotificationConstants.Targets.User);
