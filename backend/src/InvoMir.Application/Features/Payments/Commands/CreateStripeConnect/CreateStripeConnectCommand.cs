namespace InvoMir.Application.Features.Payments.Commands.CreateStripeConnect;

public sealed record CreateStripeConnectCommand : IRequest<StripeConnectUrlDto>;
