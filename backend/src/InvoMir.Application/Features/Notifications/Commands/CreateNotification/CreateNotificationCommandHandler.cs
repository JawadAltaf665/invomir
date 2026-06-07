using System.Text.Json;

namespace InvoMir.Application.Features.Notifications.Commands.CreateNotification;

public sealed class CreateNotificationCommandHandler(
    ITenantContext tenantContext,
    INotificationService notificationService)
    : IRequestHandler<CreateNotificationCommand, int>
{
    public async Task<int> Handle(
        CreateNotificationCommand request,
        CancellationToken cancellationToken)
    {
        var metadata = string.IsNullOrWhiteSpace(request.MetadataJson)
            ? null
            : JsonSerializer.Deserialize<object>(request.MetadataJson);

        return await notificationService.CreateAsync(
            new CreateNotificationInput(
                tenantContext.TenantId,
                request.Title,
                request.Message,
                request.Type,
                request.Priority,
                request.ActionUrl,
                metadata,
                request.UserId,
                request.RoleId,
                request.Target),
            cancellationToken);
    }
}
