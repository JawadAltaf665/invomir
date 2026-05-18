namespace InvoMir.Application.Features.Payments.Commands.CompleteStripeConnectCallback;

public sealed record CompleteStripeConnectCallbackCommand(
    string? Code,
    string? State) : IRequest<StripeConnectCallbackDto>;
