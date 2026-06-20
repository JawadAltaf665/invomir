using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Queries.GetEmailTemplate;

public sealed class GetEmailTemplateQueryHandler(IAppDbContext context)
    : IRequestHandler<GetEmailTemplateQuery, EmailTemplateDto>
{
    public async Task<EmailTemplateDto> Handle(
        GetEmailTemplateQuery request,
        CancellationToken cancellationToken)
    {
        var template = await context.EmailTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(currentTemplate => currentTemplate.Id == request.Id, cancellationToken);

        if (template is null)
            throw new NotFoundException(nameof(EmailTemplate), request.Id);

        return EmailingAdminMapper.ToDto(template);
    }
}
