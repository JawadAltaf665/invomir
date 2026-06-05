using System.Text.Json;
using InvoMir.Application.Features.Notifications.DTOs;

namespace InvoMir.Application.Features.Notifications;

internal static class NotificationMapper
{
    public static NotificationDto ToDto(Notification notification)
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
            notification.CreationTime,
            notification.CreatorUserId,
            notification.ActionUrl,
            ParseMetadata(notification.MetadataJson));
    }

    public static object? ParseMetadata(string? metadataJson)
    {
        if (string.IsNullOrWhiteSpace(metadataJson))
            return null;

        try
        {
            using var document = JsonDocument.Parse(metadataJson);
            return document.RootElement.Clone();
        }
        catch (JsonException)
        {
            return metadataJson;
        }
    }
}
