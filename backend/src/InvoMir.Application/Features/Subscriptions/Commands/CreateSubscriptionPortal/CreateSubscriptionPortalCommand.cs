using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Commands.CreateSubscriptionPortal;

public sealed record CreateSubscriptionPortalCommand : IRequest<SubscriptionPortalDto>;
