namespace InvoMir.Application.Features.Team.Commands.RemoveTeamMember;

public sealed class RemoveTeamMemberCommandValidator : AbstractValidator<RemoveTeamMemberCommand>
{
    public RemoveTeamMemberCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Team member id is required.");
    }
}
