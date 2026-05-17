using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Commands.CancelSubscription;

public sealed record CancelSubscriptionCommand : IRequest<SubscriptionCancellationDto>;
