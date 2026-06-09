namespace InvoMir.Application.Features.Auth.Commands.GoogleLogin;

public sealed class GoogleLoginCommandValidator : AbstractValidator<GoogleLoginCommand>
{
    public GoogleLoginCommandValidator()
    {
        RuleFor(command => command.IdToken)
            .NotEmpty().WithMessage("Google credential is required.")
            .MaximumLength(4096).WithMessage("Google credential is invalid.");
    }
}
