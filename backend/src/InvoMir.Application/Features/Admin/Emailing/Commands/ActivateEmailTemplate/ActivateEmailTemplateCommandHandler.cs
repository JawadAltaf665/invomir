using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.ActivateEmailTemplate;

public sealed class ActivateEmailTemplateCommandHandler(IAppDbContext context)
    : IRequestHandler<ActivateEmailTemplateCommand, EmailTemplateDto>
{
    public async Task<EmailTemplateDto> Handle(
        ActivateEmailTemplateCommand request,
        CancellationToken cancellationToken)
    {
        var template = await context.EmailTemplates
            .FirstOrDefaultAsync(currentTemplate => currentTemplate.Id == request.Id, cancellationToken);

        if (template is null)
            throw new NotFoundException(nameof(EmailTemplate), request.Id);

        await EmailTemplateDuplicateGuard.EnsureNoDuplicateActiveTemplateAsync(
            context,
            template.TemplateType,
            template.Language,
            template.Id,
            cancellationToken);

        template.Activate();
        await context.SaveChangesAsync(cancellationToken);

        return EmailingAdminMapper.ToDto(template);
    }
}
