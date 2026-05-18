using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Commands.CreateSubscriptionCheckout;

public sealed record CreateSubscriptionCheckoutCommand : IRequest<SubscriptionCheckoutDto>
{
    public string Plan { get; init; } = string.Empty;
    public string Interval { get; init; } = SubscriptionConstants.Intervals.Month;
}
