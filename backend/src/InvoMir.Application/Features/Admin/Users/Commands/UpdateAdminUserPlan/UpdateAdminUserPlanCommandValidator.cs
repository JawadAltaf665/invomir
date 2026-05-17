namespace InvoMir.Application.Features.Admin.Users.Commands.UpdateAdminUserPlan;

public sealed class UpdateAdminUserPlanCommandValidator : AbstractValidator<UpdateAdminUserPlanCommand>
{
    public UpdateAdminUserPlanCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("User id is required.");

        RuleFor(command => command.Plan)
            .NotEmpty().WithMessage("Plan is required.")
            .Must(plan => plan is not null &&
                AuthConstants.Plans.All.Contains(plan.Trim().ToLowerInvariant()))
            .WithMessage("Plan must be free, starter, professional, or business.");
    }
}
