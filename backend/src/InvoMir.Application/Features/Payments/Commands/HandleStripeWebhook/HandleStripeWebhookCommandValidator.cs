namespace InvoMir.Application.Features.Payments.Commands.HandleStripeWebhook;

public sealed class HandleStripeWebhookCommandValidator : AbstractValidator<HandleStripeWebhookCommand>
{
    public HandleStripeWebhookCommandValidator()
    {
        RuleFor(command => command.Payload)
            .NotEmpty().WithMessage("Stripe webhook payload is required.");

        RuleFor(command => command.SignatureHeader)
            .NotEmpty().WithMessage("Stripe-Signature header is required.");
    }
}
