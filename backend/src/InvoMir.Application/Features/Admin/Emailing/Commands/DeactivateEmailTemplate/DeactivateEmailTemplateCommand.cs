using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.DeactivateEmailTemplate;

public sealed record DeactivateEmailTemplateCommand(Guid Id) : IRequest<EmailTemplateDto>;
