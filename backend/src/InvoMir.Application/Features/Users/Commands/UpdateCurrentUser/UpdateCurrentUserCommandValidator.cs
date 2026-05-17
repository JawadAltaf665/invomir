namespace InvoMir.Application.Features.Users.Commands.UpdateCurrentUser;

public sealed class UpdateCurrentUserCommandValidator : AbstractValidator<UpdateCurrentUserCommand>
{
    public UpdateCurrentUserCommandValidator()
    {
        RuleFor(command => command.BusinessName)
            .NotEmpty()
            .MaximumLength(200)
            .When(command => command.BusinessName is not null);

        RuleFor(command => command.Currency)
            .Must(currency => currency is null ||
                AuthConstants.SupportedCurrencies.Contains(currency.Trim().ToUpperInvariant()))
            .WithMessage("Currency must be one of: USD, PKR, AED, GBP, EUR, SAR.");

        RuleFor(command => command.TaxPercent)
            .InclusiveBetween(0, 100)
            .When(command => command.TaxPercent is not null)
            .WithMessage("Tax percent must be between 0 and 100.");
    }
}
