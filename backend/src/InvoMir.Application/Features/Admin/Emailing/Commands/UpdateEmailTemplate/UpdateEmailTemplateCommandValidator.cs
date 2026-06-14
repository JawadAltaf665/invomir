namespace InvoMir.Application.Features.Admin.Emailing.Commands.UpdateEmailTemplate;

public sealed class UpdateEmailTemplateCommandValidator : AbstractValidator<UpdateEmailTemplateCommand>
{
    public UpdateEmailTemplateCommandValidator()
    {
        RuleFor(command => command.Id)
            .NotEmpty().WithMessage("Template id is required.");
        RuleFor(command => command.TemplateType)
            .IsInEnum().WithMessage("Template type is required.");
        RuleFor(command => command.Name)
            .NotEmpty().WithMessage("Template name is required.")
            .MaximumLength(200).WithMessage("Template name must not exceed 200 characters.");
        RuleFor(command => command.Subject)
            .NotEmpty().WithMessage("Template subject is required.")
            .MaximumLength(300).WithMessage("Template subject must not exceed 300 characters.");
        RuleFor(command => command.Body)
            .NotEmpty().WithMessage("Template body is required.");
        RuleFor(command => command.Language)
            .MaximumLength(20).WithMessage("Language must not exceed 20 characters.");
    }
}
