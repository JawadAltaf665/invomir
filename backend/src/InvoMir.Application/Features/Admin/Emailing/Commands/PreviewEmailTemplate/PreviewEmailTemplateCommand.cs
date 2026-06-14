using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.PreviewEmailTemplate;

public sealed record PreviewEmailTemplateCommand : IRequest<EmailTemplatePreviewDto>
{
    public EmailTemplateType? TemplateType { get; init; }
    public string? Language { get; init; }
    public string? Subject { get; init; }
    public string? Body { get; init; }
    public Dictionary<string, string>? Tokens { get; init; }
}
