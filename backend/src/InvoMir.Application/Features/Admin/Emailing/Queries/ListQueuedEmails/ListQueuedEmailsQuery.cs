using InvoMir.Application.Features.Admin.Emailing.DTOs;

namespace InvoMir.Application.Features.Admin.Emailing.Queries.ListQueuedEmails;

public sealed record ListQueuedEmailsQuery(
    QueuedEmailStatus? Status = null,
    Guid? TenantId = null,
    EmailTemplateType? TemplateType = null,
    DateTime? From = null,
    DateTime? To = null,
    string? SearchEmail = null,
    int Page = 1,
    int Limit = 20) : IRequest<PagedResult<QueuedEmailDto>>;
