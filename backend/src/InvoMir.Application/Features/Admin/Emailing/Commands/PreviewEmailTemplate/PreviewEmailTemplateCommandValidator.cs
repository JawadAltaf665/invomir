namespace InvoMir.Application.Features.Admin.Emailing.Commands.PreviewEmailTemplate;

public sealed class PreviewEmailTemplateCommandValidator : AbstractValidator<PreviewEmailTemplateCommand>
{
    public PreviewEmailTemplateCommandValidator()
    {
        RuleFor(command => command)
            .Must(command =>
                command.TemplateType is not null ||
                (!string.IsNullOrWhiteSpace(command.Subject) && !string.IsNullOrWhiteSpace(command.Body)))
            .WithMessage("Template type or subject and body are required for preview.");
        RuleFor(command => command.TemplateType)
            .IsInEnum()
            .When(command => command.TemplateType is not null)
            .WithMessage("Template type is invalid.");
        RuleFor(command => command.Language)
            .MaximumLength(20).WithMessage("Language must not exceed 20 characters.");
    }
}
