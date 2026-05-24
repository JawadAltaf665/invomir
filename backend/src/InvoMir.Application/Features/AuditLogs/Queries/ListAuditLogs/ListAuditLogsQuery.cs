using InvoMir.Application.Features.AuditLogs.DTOs;

namespace InvoMir.Application.Features.AuditLogs.Queries.ListAuditLogs;

public sealed record ListAuditLogsQuery(
    string? EntityName = null,
    Guid? EntityId = null,
    string? Action = null,
    DateTime? From = null,
    DateTime? To = null,
    string? SearchTerm = null,
    int Page = 1,
    int Limit = 20) : IRequest<PagedResult<AuditLogDto>>;
