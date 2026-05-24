namespace InvoMir.Application.Features.Team.Commands.CancelTeamInvitation;

public sealed class CancelTeamInvitationCommandValidator : AbstractValidator<CancelTeamInvitationCommand>
{
    public CancelTeamInvitationCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Invitation id is required.");
    }
}
