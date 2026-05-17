using System.Text.Json;

namespace InvoMir.Domain.Entities;

public sealed class AuditLog
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid? TenantId { get; private set; }
    public Guid? UserId { get; private set; }
    public string EntityName { get; private set; } = string.Empty;
    public Guid? EntityId { get; private set; }
    public string Action { get; private set; } = string.Empty;
    public string? OldValues { get; private set; }
    public string? NewValues { get; private set; }
    public string? IpAddress { get; private set; }
    public string? UserAgent { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private AuditLog()
    {
    }

    public static AuditLog Create(
        string entityName,
        Guid? entityId,
        string action,
        Guid? tenantId = null,
        Guid? userId = null,
        object? oldValues = null,
        object? newValues = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        if (string.IsNullOrWhiteSpace(entityName))
            throw new ArgumentException("Entity name is required.", nameof(entityName));

        if (string.IsNullOrWhiteSpace(action))
            throw new ArgumentException("Audit action is required.", nameof(action));

        return new AuditLog
        {
            TenantId = tenantId,
            UserId = userId,
            EntityName = entityName.Trim(),
            EntityId = entityId,
            Action = action.Trim(),
            OldValues = SerializeValues(oldValues),
            NewValues = SerializeValues(newValues),
            IpAddress = NormalizeOptionalValue(ipAddress),
            UserAgent = NormalizeOptionalValue(userAgent)
        };
    }

    private static string? SerializeValues(object? values)
    {
        return values is null ? null : JsonSerializer.Serialize(values);
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
