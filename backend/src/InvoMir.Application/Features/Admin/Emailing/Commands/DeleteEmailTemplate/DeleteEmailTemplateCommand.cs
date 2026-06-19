namespace InvoMir.Application.Features.Admin.Emailing.Commands.DeleteEmailTemplate;

public sealed record DeleteEmailTemplateCommand(Guid Id) : IRequest<bool>;
