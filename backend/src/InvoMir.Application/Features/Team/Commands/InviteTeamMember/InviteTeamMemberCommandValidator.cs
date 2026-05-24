namespace InvoMir.Application.Features.Team.Commands.InviteTeamMember;

public sealed class InviteTeamMemberCommandValidator : AbstractValidator<InviteTeamMemberCommand>
{
    public InviteTeamMemberCommandValidator()
    {
        RuleFor(command => command.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Email format is invalid.")
            .MaximumLength(255).WithMessage("Email must not exceed 255 characters.");

        RuleFor(command => command.Role)
            .NotEmpty().WithMessage("Role is required.")
            .Must(role => role is not null &&
                TeamConstants.Roles.Manageable.Contains(role.Trim().ToLowerInvariant()))
            .WithMessage("Role must be owner, admin, or member.");
    }
}
