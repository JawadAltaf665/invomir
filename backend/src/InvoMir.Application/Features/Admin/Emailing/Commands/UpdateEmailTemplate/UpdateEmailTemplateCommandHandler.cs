using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.UpdateEmailTemplate;

public sealed class UpdateEmailTemplateCommandHandler(IAppDbContext context)
    : IRequestHandler<UpdateEmailTemplateCommand, EmailTemplateDto>
{
    public async Task<EmailTemplateDto> Handle(
        UpdateEmailTemplateCommand request,
        CancellationToken cancellationToken)
    {
        var template = await context.EmailTemplates
            .FirstOrDefaultAsync(currentTemplate => currentTemplate.Id == request.Id, cancellationToken);

        if (template is null)
            throw new NotFoundException(nameof(EmailTemplate), request.Id);

        var language = EmailTemplateDuplicateGuard.NormalizeLanguage(request.Language);
        if (request.IsActive)
        {
            await EmailTemplateDuplicateGuard.EnsureNoDuplicateActiveTemplateAsync(
                context,
                request.TemplateType,
                language,
                request.Id,
                cancellationToken);
        }

        template.Update(
            request.TemplateType,
            request.Name,
            request.Subject,
            request.Body,
            language,
            request.IsActive);

        await context.SaveChangesAsync(cancellationToken);

        return EmailingAdminMapper.ToDto(template);
    }
}
