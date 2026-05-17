namespace InvoMir.Application.Features.Payments.Commands.HandleStripeWebhook;

public sealed record HandleStripeWebhookCommand(
    string Payload,
    string SignatureHeader) : IRequest;
