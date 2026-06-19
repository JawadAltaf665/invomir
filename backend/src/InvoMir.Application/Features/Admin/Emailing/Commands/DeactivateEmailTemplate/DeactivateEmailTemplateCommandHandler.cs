using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.DeactivateEmailTemplate;

public sealed class DeactivateEmailTemplateCommandHandler(IAppDbContext context)
    : IRequestHandler<DeactivateEmailTemplateCommand, EmailTemplateDto>
{
    public async Task<EmailTemplateDto> Handle(
        DeactivateEmailTemplateCommand request,
        CancellationToken cancellationToken)
    {
        var template = await context.EmailTemplates
            .FirstOrDefaultAsync(currentTemplate => currentTemplate.Id == request.Id, cancellationToken);

        if (template is null)
            throw new NotFoundException(nameof(EmailTemplate), request.Id);

        template.Deactivate();
        await context.SaveChangesAsync(cancellationToken);

        return EmailingAdminMapper.ToDto(template);
    }
}
