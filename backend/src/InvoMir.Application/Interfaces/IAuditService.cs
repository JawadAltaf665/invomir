namespace InvoMir.Application.Interfaces;

public interface IAuditService
{
    Task LogAsync(
        string entityName,
        Guid? entityId,
        string action,
        Guid? tenantId = null,
        Guid? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null,
        CancellationToken cancellationToken = default);
}
