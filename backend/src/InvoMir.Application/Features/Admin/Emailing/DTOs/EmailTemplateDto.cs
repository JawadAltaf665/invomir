namespace InvoMir.Application.Features.Admin.Emailing.DTOs;

public sealed record EmailTemplateDto(
    Guid Id,
    EmailTemplateType TemplateType,
    string TemplateTypeName,
    string Name,
    string Subject,
    string Body,
    string Language,
    bool IsActive,
    bool IsSystemTemplate,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
