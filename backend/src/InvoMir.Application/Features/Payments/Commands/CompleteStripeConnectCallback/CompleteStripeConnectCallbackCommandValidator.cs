namespace InvoMir.Application.Features.Payments.Commands.CompleteStripeConnectCallback;

public sealed class CompleteStripeConnectCallbackCommandValidator
    : AbstractValidator<CompleteStripeConnectCallbackCommand>
{
    public CompleteStripeConnectCallbackCommandValidator()
    {
        RuleFor(command => command.Code)
            .NotEmpty()
            .WithMessage("Stripe authorization code is required.");

        RuleFor(command => command.State)
            .NotEmpty()
            .WithMessage("Stripe Connect state is required.");
    }
}
