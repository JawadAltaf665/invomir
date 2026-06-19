using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Queries.ListEmailTemplates;

public sealed record ListEmailTemplatesQuery(
    EmailTemplateType? TemplateType = null,
    string? Language = null,
    bool? IsActive = null,
    string? Search = null,
    int Page = 1,
    int Limit = 20) : IRequest<PagedResult<EmailTemplateDto>>;
