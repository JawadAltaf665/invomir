using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.RetryQueuedEmail;

public sealed record RetryQueuedEmailCommand(Guid Id) : IRequest<QueuedEmailDto>;
