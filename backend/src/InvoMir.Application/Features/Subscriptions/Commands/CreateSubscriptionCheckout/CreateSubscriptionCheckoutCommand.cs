using System.Text.Json.Serialization;
using InvoMir.Application.Features.Subscriptions.DTOs;

namespace InvoMir.Application.Features.Subscriptions.Commands.CreateSubscriptionCheckout;

public sealed record CreateSubscriptionCheckoutCommand : IRequest<SubscriptionCheckoutDto>
{
    [JsonPropertyName("plan")]
    public string Plan { get; init; } = string.Empty;

    [JsonPropertyName("interval")]
    public string Interval { get; init; } = SubscriptionConstants.Intervals.Month;
}
