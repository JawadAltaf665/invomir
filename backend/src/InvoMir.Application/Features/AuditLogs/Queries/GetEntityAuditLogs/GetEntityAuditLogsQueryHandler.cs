using System.Text.Json;
using InvoMir.Application.Features.AuditLogs.DTOs;

namespace InvoMir.Application.Features.AuditLogs.Queries.GetEntityAuditLogs;

public sealed class GetEntityAuditLogsQueryHandler(
    IAppDbContext context,
    ITenantContext tenantContext,
    ICurrentUserContext currentUserContext)
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
        var isSystemAdmin = await IsSystemAdminAsync(cancellationToken);
        var query = context.AuditLogs
            .AsNoTracking()
            .Where(auditLog =>
                auditLog.EntityName.ToLower() == entityName &&
                auditLog.EntityId == request.EntityId);

        if (!isSystemAdmin)
        {
            var tenantId = tenantContext.TenantId;
            query = query.Where(auditLog => auditLog.TenantId == tenantId);
        }

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

        var actors = await LoadActorsAsync(auditLogs, isSystemAdmin, cancellationToken);
        var tenants = await LoadTenantsAsync(auditLogs, isSystemAdmin, cancellationToken);
        var entityLabels = await LoadEntityLabelsAsync(auditLogs, isSystemAdmin, cancellationToken);
        var items = auditLogs
            .Select(auditLog => ToDto(auditLog, actors, tenants, entityLabels))
            .ToList();

        return new PagedResult<AuditLogDto>(items, page, limit, totalCount);
    }

    private async Task<bool> IsSystemAdminAsync(CancellationToken cancellationToken)
    {
        var currentUserId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("Current user context is not available.");

        var role = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user => user.Id == currentUserId && !user.IsDeleted)
            .Select(user => user.Role)
            .FirstOrDefaultAsync(cancellationToken);

        return string.Equals(role, AuthConstants.Roles.SystemAdmin, StringComparison.OrdinalIgnoreCase);
    }

    private async Task<IReadOnlyDictionary<Guid, AuditActorSnapshot>> LoadActorsAsync(
        IReadOnlyList<AuditLogSnapshot> auditLogs,
        bool isSystemAdmin,
        CancellationToken cancellationToken)
    {
        var userIds = auditLogs
            .Where(auditLog => auditLog.UserId.HasValue)
            .Select(auditLog => auditLog.UserId!.Value)
            .Distinct()
            .ToList();

        if (userIds.Count == 0)
            return new Dictionary<Guid, AuditActorSnapshot>();

        var query = context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user => userIds.Contains(user.Id));

        if (!isSystemAdmin)
        {
            var tenantId = tenantContext.TenantId;
            query = query.Where(user => user.TenantId == tenantId);
        }

        return await query
            .Select(user => new AuditActorSnapshot(
                user.Id,
                user.Email,
                $"{user.FirstName} {user.LastName}".Trim()))
            .ToDictionaryAsync(actor => actor.UserId, cancellationToken);
    }

    private async Task<IReadOnlyDictionary<Guid, string>> LoadTenantsAsync(
        IReadOnlyList<AuditLogSnapshot> auditLogs,
        bool isSystemAdmin,
        CancellationToken cancellationToken)
    {
        var tenantIds = auditLogs
            .Where(auditLog => auditLog.TenantId.HasValue)
            .Select(auditLog => auditLog.TenantId!.Value)
            .Distinct()
            .ToList();

        if (tenantIds.Count == 0)
            return new Dictionary<Guid, string>();

        var query = context.Tenants
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(tenant => tenantIds.Contains(tenant.Id));

        if (!isSystemAdmin)
        {
            var tenantId = tenantContext.TenantId;
            query = query.Where(tenant => tenant.Id == tenantId);
        }

        return await query
            .Select(tenant => new AuditTenantSnapshot(tenant.Id, tenant.Name))
            .ToDictionaryAsync(tenant => tenant.TenantId, tenant => tenant.Name, cancellationToken);
    }

    private async Task<IReadOnlyDictionary<EntityReferenceKey, string>> LoadEntityLabelsAsync(
        IReadOnlyList<AuditLogSnapshot> auditLogs,
        bool isSystemAdmin,
        CancellationToken cancellationToken)
    {
        var keys = auditLogs
            .Where(auditLog => auditLog.EntityId.HasValue)
            .Select(auditLog => new EntityReferenceKey(
                auditLog.EntityName.Trim().ToLowerInvariant(),
                auditLog.EntityId!.Value))
            .Distinct()
            .ToList();

        if (keys.Count == 0)
            return new Dictionary<EntityReferenceKey, string>();

        var labels = new Dictionary<EntityReferenceKey, string>();
        var tenantId = tenantContext.TenantId;

        await AddInvoiceLabelsAsync(labels, keys, isSystemAdmin, tenantId, cancellationToken);
        await AddClientLabelsAsync(labels, keys, isSystemAdmin, tenantId, cancellationToken);
        await AddUserLabelsAsync(labels, keys, isSystemAdmin, tenantId, cancellationToken);
        await AddTeamInvitationLabelsAsync(labels, keys, isSystemAdmin, tenantId, cancellationToken);

        return labels;
    }

    private async Task AddInvoiceLabelsAsync(
        IDictionary<EntityReferenceKey, string> labels,
        IReadOnlyCollection<EntityReferenceKey> keys,
        bool isSystemAdmin,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var ids = keys
            .Where(key => key.EntityName == AuditConstants.Entities.Invoice.ToLowerInvariant())
            .Select(key => key.EntityId)
            .ToList();

        if (ids.Count == 0)
            return;

        var query = context.Invoices
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(invoice => !invoice.IsDeleted && ids.Contains(invoice.Id));

        if (!isSystemAdmin)
            query = query.Where(invoice => invoice.TenantId == tenantId);

        var rows = await query
            .Select(invoice => new { invoice.Id, invoice.InvoiceNumber })
            .ToListAsync(cancellationToken);

        foreach (var row in rows)
            labels[new EntityReferenceKey(AuditConstants.Entities.Invoice.ToLowerInvariant(), row.Id)] = row.InvoiceNumber;
    }

    private async Task AddClientLabelsAsync(
        IDictionary<EntityReferenceKey, string> labels,
        IReadOnlyCollection<EntityReferenceKey> keys,
        bool isSystemAdmin,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var ids = keys
            .Where(key => key.EntityName == AuditConstants.Entities.Client.ToLowerInvariant())
            .Select(key => key.EntityId)
            .ToList();

        if (ids.Count == 0)
            return;

        var query = context.Clients
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(client => !client.IsDeleted && ids.Contains(client.Id));

        if (!isSystemAdmin)
            query = query.Where(client => client.TenantId == tenantId);

        var rows = await query
            .Select(client => new { client.Id, client.Name, client.Email })
            .ToListAsync(cancellationToken);

        foreach (var row in rows)
        {
            var displayName = string.IsNullOrWhiteSpace(row.Name) ? row.Email : row.Name;
            labels[new EntityReferenceKey(AuditConstants.Entities.Client.ToLowerInvariant(), row.Id)] = displayName;
        }
    }

    private async Task AddUserLabelsAsync(
        IDictionary<EntityReferenceKey, string> labels,
        IReadOnlyCollection<EntityReferenceKey> keys,
        bool isSystemAdmin,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var ids = keys
            .Where(key => key.EntityName == AuditConstants.Entities.User.ToLowerInvariant())
            .Select(key => key.EntityId)
            .ToList();

        if (ids.Count == 0)
            return;

        var query = context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user => !user.IsDeleted && ids.Contains(user.Id));

        if (!isSystemAdmin)
            query = query.Where(user => user.TenantId == tenantId);

        var rows = await query
            .Select(user => new { user.Id, user.Email, user.FirstName, user.LastName })
            .ToListAsync(cancellationToken);

        foreach (var row in rows)
        {
            var name = $"{row.FirstName} {row.LastName}".Trim();
            labels[new EntityReferenceKey(AuditConstants.Entities.User.ToLowerInvariant(), row.Id)] =
                string.IsNullOrWhiteSpace(name) ? row.Email : name;
        }
    }

    private async Task AddTeamInvitationLabelsAsync(
        IDictionary<EntityReferenceKey, string> labels,
        IReadOnlyCollection<EntityReferenceKey> keys,
        bool isSystemAdmin,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var ids = keys
            .Where(key => key.EntityName == AuditConstants.Entities.TeamInvitation.ToLowerInvariant())
            .Select(key => key.EntityId)
            .ToList();

        if (ids.Count == 0)
            return;

        var query = context.TeamInvitations
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(invitation => !invitation.IsDeleted && ids.Contains(invitation.Id));

        if (!isSystemAdmin)
            query = query.Where(invitation => invitation.TenantId == tenantId);

        var rows = await query
            .Select(invitation => new { invitation.Id, invitation.Email })
            .ToListAsync(cancellationToken);

        foreach (var row in rows)
            labels[new EntityReferenceKey(AuditConstants.Entities.TeamInvitation.ToLowerInvariant(), row.Id)] = row.Email;
    }

    private static AuditLogDto ToDto(
        AuditLogSnapshot auditLog,
        IReadOnlyDictionary<Guid, AuditActorSnapshot> actors,
        IReadOnlyDictionary<Guid, string> tenants,
        IReadOnlyDictionary<EntityReferenceKey, string> entityLabels)
    {
        var actor = auditLog.UserId.HasValue && actors.TryGetValue(auditLog.UserId.Value, out var currentActor)
            ? currentActor
            : null;
        var tenantName = auditLog.TenantId.HasValue && tenants.TryGetValue(auditLog.TenantId.Value, out var currentTenantName)
            ? currentTenantName
            : null;
        var entityLabelKey = auditLog.EntityId.HasValue
            ? new EntityReferenceKey(auditLog.EntityName.Trim().ToLowerInvariant(), auditLog.EntityId.Value)
            : default;
        var entityDisplayName = auditLog.EntityId.HasValue &&
            entityLabels.TryGetValue(entityLabelKey, out var currentEntityLabel)
                ? currentEntityLabel
                : null;

        return new AuditLogDto(
            auditLog.Id,
            auditLog.TenantId,
            tenantName,
            auditLog.UserId,
            actor?.Email,
            actor?.Name,
            auditLog.EntityName,
            auditLog.EntityId,
            entityDisplayName,
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

    private sealed record AuditTenantSnapshot(
        Guid TenantId,
        string Name);

    private readonly record struct EntityReferenceKey(
        string EntityName,
        Guid EntityId);
}
