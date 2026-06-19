using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Commands.CancelQueuedEmail;

public sealed record CancelQueuedEmailCommand(Guid Id) : IRequest<QueuedEmailDto>;
