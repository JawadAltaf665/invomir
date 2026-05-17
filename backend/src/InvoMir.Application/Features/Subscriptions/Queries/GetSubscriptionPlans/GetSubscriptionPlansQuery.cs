using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Queries.GetSubscriptionPlans;

public sealed record GetSubscriptionPlansQuery : IRequest<SubscriptionPlansDto>;
