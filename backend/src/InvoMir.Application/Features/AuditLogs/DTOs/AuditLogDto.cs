namespace InvoMir.Application.Features.AuditLogs.DTOs;

public sealed record AuditLogDto(
    Guid Id,
    Guid? TenantId,
    string? TenantName,
    Guid? UserId,
    string? UserEmail,
    string? UserName,
    string EntityName,
    Guid? EntityId,
    string? EntityDisplayName,
    string Action,
    object? OldValues,
    object? NewValues,
    string? IpAddress,
    string? UserAgent,
    DateTime CreatedAt);
