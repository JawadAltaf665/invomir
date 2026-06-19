using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Queries.GetEmailTemplate;

public sealed record GetEmailTemplateQuery(Guid Id) : IRequest<EmailTemplateDto>;
