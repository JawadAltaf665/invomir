namespace InvoMir.Application.Features.Auth.Commands.VerifyEmail;

public sealed class VerifyEmailCommandValidator : AbstractValidator<VerifyEmailCommand>
{
    public VerifyEmailCommandValidator()
    {
        RuleFor(command => command.Token)
            .NotEmpty().WithMessage("Verification token is required.")
            .MaximumLength(200).WithMessage("Verification token is invalid.");
    }
}
