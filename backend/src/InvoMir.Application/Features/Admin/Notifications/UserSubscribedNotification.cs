using MediatR;

namespace InvoMir.Application.Features.Admin.Notifications;

public sealed record UserSubscribedNotification(
    Guid UserId,
    Guid TenantId,
    string UserEmail,
    string UserName,
    string Plan,
    DateTime SubscribedAt) : INotification;
