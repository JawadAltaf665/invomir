namespace InvoMir.Application.Features.AuditLogs.DTOs;

public sealed record AuditLogDto(
    Guid Id,
    Guid? TenantId,
    Guid? UserId,
    string? UserEmail,
    string? UserName,
    string EntityName,
    Guid? EntityId,
    string Action,
    object? OldValues,
    object? NewValues,
    string? IpAddress,
    string? UserAgent,
    DateTime CreatedAt);
