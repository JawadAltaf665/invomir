namespace InvoMir.Application.Features.Admin.Users.Commands.UpdateAdminUserTrial;

public sealed class UpdateAdminUserTrialCommandValidator : AbstractValidator<UpdateAdminUserTrialCommand>
{
    public UpdateAdminUserTrialCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("User id is required.");

        RuleFor(command => command.TrialEndsAt)
            .Must(trialEndsAt => NormalizeUtc(trialEndsAt) > DateTime.UtcNow)
            .WithMessage("Trial end date must be in the future.");
    }

    private static DateTime NormalizeUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }
}
