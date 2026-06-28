namespace InvoMir.Application.Features.Payments.Commands.DisconnectStripeConnect;

public sealed record DisconnectStripeConnectCommand : IRequest<StripeDisconnectResultDto>;
