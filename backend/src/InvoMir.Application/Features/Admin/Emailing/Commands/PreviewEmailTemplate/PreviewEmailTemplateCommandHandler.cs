using InvoMir.Application.Features.Admin.Emailing.DTOs;
using InvoMir.Application.Features.Emailing;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.PreviewEmailTemplate;

public sealed class PreviewEmailTemplateCommandHandler(IEmailTemplateService emailTemplateService)
    : IRequestHandler<PreviewEmailTemplateCommand, EmailTemplatePreviewDto>
{
    public async Task<EmailTemplatePreviewDto> Handle(
        PreviewEmailTemplateCommand request,
        CancellationToken cancellationToken)
    {
        var tokens = request.Tokens ?? [];

        if (!string.IsNullOrWhiteSpace(request.Subject) && !string.IsNullOrWhiteSpace(request.Body))
        {
            return new EmailTemplatePreviewDto(
                EmailTemplateService.RenderTokens(request.Subject, tokens),
                EmailTemplateService.RenderTokens(request.Body, tokens));
        }

        if (request.TemplateType is null)
            throw new BadRequestException("Template type is required for preview.");

        var language = EmailTemplateDuplicateGuard.NormalizeLanguage(request.Language);
        var subject = await emailTemplateService.RenderSubjectAsync(
            request.TemplateType.Value,
            tokens,
            language,
            cancellationToken);
        var body = await emailTemplateService.RenderBodyAsync(
            request.TemplateType.Value,
            tokens,
            language,
            cancellationToken);

        return new EmailTemplatePreviewDto(subject, body);
    }
}
