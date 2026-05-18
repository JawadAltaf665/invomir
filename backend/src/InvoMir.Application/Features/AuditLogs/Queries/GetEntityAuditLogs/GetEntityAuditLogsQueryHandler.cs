using System.Text.Json;
using InvoMir.Application.Features.AuditLogs.DTOs;

namespace InvoMir.Application.Features.AuditLogs.Queries.GetEntityAuditLogs;

public sealed class GetEntityAuditLogsQueryHandler(
    IAppDbContext context,
    ITenantContext tenantContext)
    : IRequestHandler<GetEntityAuditLogsQuery, PagedResult<AuditLogDto>>
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 50;
    private const int MaxLimit = 100;

    public async Task<PagedResult<AuditLogDto>> Handle(
        GetEntityAuditLogsQuery request,
        CancellationToken cancellationToken)
    {
        if (!tenantContext.IsAuthenticated)
            throw new UnauthorizedAccessException("Tenant context is not available.");

        var page = request.Page < DefaultPage ? DefaultPage : request.Page;
        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);
        var entityName = request.EntityName.Trim().ToLowerInvariant();
        var query = context.AuditLogs
            .AsNoTracking()
            .Where(auditLog =>
                auditLog.TenantId == tenantContext.TenantId &&
                auditLog.EntityName.ToLower() == entityName &&
                auditLog.EntityId == request.EntityId);

        if (request.From.HasValue)
            query = query.Where(auditLog => auditLog.CreatedAt >= NormalizeUtc(request.From.Value));

        if (request.To.HasValue)
            query = query.Where(auditLog => auditLog.CreatedAt <= NormalizeUtc(request.To.Value));

        var totalCount = await query.CountAsync(cancellationToken);
        var auditLogs = await query
            .OrderByDescending(auditLog => auditLog.CreatedAt)
            .Select(auditLog => new AuditLogSnapshot(
                auditLog.Id,
                auditLog.TenantId,
                auditLog.UserId,
                auditLog.EntityName,
                auditLog.EntityId,
                auditLog.Action,
                auditLog.OldValues,
                auditLog.NewValues,
                auditLog.IpAddress,
                auditLog.UserAgent,
                auditLog.CreatedAt))
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var actors = await LoadActorsAsync(auditLogs, cancellationToken);
        var items = auditLogs
            .Select(auditLog => ToDto(auditLog, actors))
            .ToList();

        return new PagedResult<AuditLogDto>(items, page, limit, totalCount);
    }

    private async Task<IReadOnlyDictionary<Guid, AuditActorSnapshot>> LoadActorsAsync(
        IReadOnlyList<AuditLogSnapshot> auditLogs,
        CancellationToken cancellationToken)
    {
        var userIds = auditLogs
            .Where(auditLog => auditLog.UserId.HasValue)
            .Select(auditLog => auditLog.UserId!.Value)
            .Distinct()
            .ToList();

        if (userIds.Count == 0)
            return new Dictionary<Guid, AuditActorSnapshot>();

        return await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user =>
                user.TenantId == tenantContext.TenantId &&
                userIds.Contains(user.Id))
            .Select(user => new AuditActorSnapshot(
                user.Id,
                user.Email,
                $"{user.FirstName} {user.LastName}".Trim()))
            .ToDictionaryAsync(actor => actor.UserId, cancellationToken);
    }

    private static AuditLogDto ToDto(
        AuditLogSnapshot auditLog,
        IReadOnlyDictionary<Guid, AuditActorSnapshot> actors)
    {
        var actor = auditLog.UserId.HasValue && actors.TryGetValue(auditLog.UserId.Value, out var currentActor)
            ? currentActor
            : null;

        return new AuditLogDto(
            auditLog.Id,
            auditLog.TenantId,
            auditLog.UserId,
            actor?.Email,
            actor?.Name,
            auditLog.EntityName,
            auditLog.EntityId,
            auditLog.Action,
            ParseJsonValue(auditLog.OldValues),
            ParseJsonValue(auditLog.NewValues),
            auditLog.IpAddress,
            auditLog.UserAgent,
            auditLog.CreatedAt);
    }

    private static object? ParseJsonValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        try
        {
            using var document = JsonDocument.Parse(value);
            return document.RootElement.Clone();
        }
        catch (JsonException)
        {
            return value;
        }
    }

    private static DateTime NormalizeUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
    }

    private sealed record AuditLogSnapshot(
        Guid Id,
        Guid? TenantId,
        Guid? UserId,
        string EntityName,
        Guid? EntityId,
        string Action,
        string? OldValues,
        string? NewValues,
        string? IpAddress,
        string? UserAgent,
        DateTime CreatedAt);

    private sealed record AuditActorSnapshot(
        Guid UserId,
        string Email,
        string Name);
}
