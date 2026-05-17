namespace InvoMir.Infrastructure.Services;

public sealed class AuditService(
    IAppDbContext context,
    ILogger<AuditService> logger)
    : IAuditService
{
    public async Task LogAsync(
        string entityName,
        Guid? entityId,
        string action,
        Guid? tenantId = null,
        Guid? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var auditLog = AuditLog.Create(
                entityName,
                entityId,
                action,
                tenantId,
                userId,
                oldValues,
                newValues,
                ipAddress,
                userAgent);

            context.AuditLogs.Add(auditLog);
            await context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Audit write failed for entity {EntityName}, action {Action}, tenant {TenantId}, user {UserId}.",
                entityName,
                action,
                tenantId,
                userId);
        }
    }
}
