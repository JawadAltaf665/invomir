using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.UpdateEmailTemplate;

public sealed record UpdateEmailTemplateCommand : IRequest<EmailTemplateDto>
{
    public Guid Id { get; init; }
    public EmailTemplateType TemplateType { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Subject { get; init; } = string.Empty;
    public string Body { get; init; } = string.Empty;
    public string? Language { get; init; }
    public bool IsActive { get; init; } = true;
}
