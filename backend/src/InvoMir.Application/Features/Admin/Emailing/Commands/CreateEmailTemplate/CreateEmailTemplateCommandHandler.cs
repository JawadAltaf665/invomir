using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.CreateEmailTemplate;

public sealed class CreateEmailTemplateCommandHandler(IAppDbContext context)
    : IRequestHandler<CreateEmailTemplateCommand, EmailTemplateDto>
{
    public async Task<EmailTemplateDto> Handle(
        CreateEmailTemplateCommand request,
        CancellationToken cancellationToken)
    {
        var language = EmailTemplateDuplicateGuard.NormalizeLanguage(request.Language);
        if (request.IsActive)
        {
            await EmailTemplateDuplicateGuard.EnsureNoDuplicateActiveTemplateAsync(
                context,
                request.TemplateType,
                language,
                null,
                cancellationToken);
        }

        var template = EmailTemplate.Create(
            request.TemplateType,
            request.Name,
            request.Subject,
            request.Body,
            language,
            request.IsActive,
            request.IsSystemTemplate);

        context.EmailTemplates.Add(template);
        await context.SaveChangesAsync(cancellationToken);

        return EmailingAdminMapper.ToDto(template);
    }
}
