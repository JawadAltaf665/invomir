using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.ActivateEmailTemplate;

public sealed record ActivateEmailTemplateCommand(Guid Id) : IRequest<EmailTemplateDto>;
