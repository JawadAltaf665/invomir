namespace InvoMir.Application.Features.Subscriptions.Commands.CreateSubscriptionCheckout;

public sealed class CreateSubscriptionCheckoutCommandValidator : AbstractValidator<CreateSubscriptionCheckoutCommand>
{
    public CreateSubscriptionCheckoutCommandValidator()
    {
        RuleFor(command => command.Plan)
            .NotEmpty().WithMessage("Subscription plan is required.")
            .Must(plan => plan is not null &&
                AuthConstants.Plans.Paid.Contains(plan.Trim().ToLowerInvariant()))
            .WithMessage("Subscription plan must be starter, professional, or business.");

        RuleFor(command => command.Interval)
            .NotEmpty().WithMessage("Subscription interval is required.")
            .Must(interval => interval is not null &&
                SubscriptionConstants.Intervals.All.Contains(interval.Trim().ToLowerInvariant()))
            .WithMessage("Subscription interval must be month or year.");
    }
}
