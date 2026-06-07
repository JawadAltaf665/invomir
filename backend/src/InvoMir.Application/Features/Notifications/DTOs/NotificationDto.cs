namespace InvoMir.Application.Features.Notifications.DTOs;

public sealed record NotificationDto(
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
    object? Metadata);
