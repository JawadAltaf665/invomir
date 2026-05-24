namespace InvoMir.Application.Features.Team.Commands.ChangeTeamMemberRole;

public sealed class ChangeTeamMemberRoleCommandValidator : AbstractValidator<ChangeTeamMemberRoleCommand>
{
    public ChangeTeamMemberRoleCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Team member id is required.");

        RuleFor(command => command.Role)
            .NotEmpty().WithMessage("Role is required.")
            .Must(role => role is not null &&
                TeamConstants.Roles.Manageable.Contains(role.Trim().ToLowerInvariant()))
            .WithMessage("Role must be owner, admin, or member.");
    }
}
