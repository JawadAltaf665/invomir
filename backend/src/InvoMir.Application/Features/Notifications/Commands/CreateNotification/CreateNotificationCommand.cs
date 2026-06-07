namespace InvoMir.Application.Features.Notifications.Commands.CreateNotification;

public sealed record CreateNotificationCommand(
    string Title,
    string Message,
    string Type,
    string Priority,
    string Target,
    Guid? UserId,
    string? RoleId,
    string? ActionUrl,
    string? MetadataJson)
    : IRequest<int>;
