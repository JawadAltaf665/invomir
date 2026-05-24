namespace InvoMir.Application.Features.Team.Commands.AcceptTeamInvitation;

public sealed class AcceptTeamInvitationCommandValidator : AbstractValidator<AcceptTeamInvitationCommand>
{
    public AcceptTeamInvitationCommandValidator()
    {
        RuleFor(command => command.Token)
            .NotEmpty().WithMessage("Invitation token is required.");

        RuleFor(command => command.FirstName)
            .NotEmpty().WithMessage("First name is required.")
            .MaximumLength(100).WithMessage("First name must not exceed 100 characters.");

        RuleFor(command => command.LastName)
            .NotEmpty().WithMessage("Last name is required.")
            .MaximumLength(100).WithMessage("Last name must not exceed 100 characters.");

        RuleFor(command => command.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(8).WithMessage("Password must be at least 8 characters.")
            .MaximumLength(128).WithMessage("Password must not exceed 128 characters.")
            .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain at least one number.");
    }
}
