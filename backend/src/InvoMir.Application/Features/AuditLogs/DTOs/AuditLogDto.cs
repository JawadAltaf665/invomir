using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.AuditLogs.DTOs;

public sealed record AuditLogDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("tenantId")] Guid? TenantId,
    [property: JsonPropertyName("userId")] Guid? UserId,
    [property: JsonPropertyName("userEmail")] string? UserEmail,
    [property: JsonPropertyName("userName")] string? UserName,
    [property: JsonPropertyName("entityName")] string EntityName,
    [property: JsonPropertyName("entityId")] Guid? EntityId,
    [property: JsonPropertyName("action")] string Action,
    [property: JsonPropertyName("oldValues")] object? OldValues,
    [property: JsonPropertyName("newValues")] object? NewValues,
    [property: JsonPropertyName("ipAddress")] string? IpAddress,
    [property: JsonPropertyName("userAgent")] string? UserAgent,
    [property: JsonPropertyName("createdAt")] DateTime CreatedAt);
