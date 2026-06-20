using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.CreateEmailTemplate;

public sealed record CreateEmailTemplateCommand : IRequest<EmailTemplateDto>
{
    public EmailTemplateType TemplateType { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public string? Language { get; init; }
    public bool IsActive { get; init; } = true;
    public bool IsSystemTemplate { get; init; } = true;
}
