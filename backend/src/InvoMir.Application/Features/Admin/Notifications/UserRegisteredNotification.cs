using MediatR;

namespace InvoMir.Application.Features.Admin.Notifications;

public sealed record UserRegisteredNotification(
    Guid UserId,
    Guid TenantId,
    string Email,
    string BusinessName,
    DateTime RegisteredAt,
    string AuthProvider) : INotification;
