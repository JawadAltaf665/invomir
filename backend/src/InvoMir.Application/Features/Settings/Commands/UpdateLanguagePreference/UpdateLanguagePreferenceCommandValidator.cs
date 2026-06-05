namespace InvoMir.Application.Features.Settings.Commands.UpdateLanguagePreference;

public sealed class UpdateLanguagePreferenceCommandValidator
    : AbstractValidator<UpdateLanguagePreferenceCommand>
{
    public UpdateLanguagePreferenceCommandValidator()
    {
        RuleFor(command => command.Language)
            .NotEmpty()
            .Must(language => LanguageConstants.TryNormalize(language, out _))
            .WithMessage($"Language must be one of: {string.Join(", ", LanguageConstants.Supported)}.");
    }
}
