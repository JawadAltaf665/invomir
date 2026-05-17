using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Queries.GetCurrentSubscription;

public sealed record GetCurrentSubscriptionQuery : IRequest<CurrentSubscriptionDto>;
