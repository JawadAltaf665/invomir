using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Queries.GetQueuedEmail;

public sealed record GetQueuedEmailQuery(Guid Id) : IRequest<QueuedEmailDto>;
