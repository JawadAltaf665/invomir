using InvoMir.Application.Features.AuditLogs.DTOs;

namespace InvoMir.Application.Features.AuditLogs.Queries.GetEntityAuditLogs;

public sealed record GetEntityAuditLogsQuery(
    string EntityName,
    Guid EntityId,
    DateTime? From = null,
    DateTime? To = null,
    int Page = 1,
    int Limit = 50) : IRequest<PagedResult<AuditLogDto>>;
