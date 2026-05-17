namespace InvoMir.Application.Features.Users.Commands.ChangeCurrentUserPassword;

public sealed class ChangeCurrentUserPasswordCommandValidator : AbstractValidator<ChangeCurrentUserPasswordCommand>
{
    public ChangeCurrentUserPasswordCommandValidator()
    {
        RuleFor(command => command.CurrentPassword)
            .NotEmpty().WithMessage("Current password is required.");

        RuleFor(command => command.NewPassword)
            .NotEmpty().WithMessage("New password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(128).WithMessage("Password must not exceed 128 characters.")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.")
            .NotEqual(command => command.CurrentPassword)
            .WithMessage("New password must be different from current password.");
    }
}
