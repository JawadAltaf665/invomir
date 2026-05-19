namespace InvoMir.Application.Features.Users.DTOs;

public sealed record UserPermissionsDto(
    Guid UserId,
    Guid TenantId,
    string Role,
    IReadOnlyCollection<string> Permissions);
