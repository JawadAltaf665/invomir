namespace InvoMir.Application.Features.Auth.DTOs;

public sealed record AuthTokenDto(
    string AccessToken,
    Guid UserId,
    Guid TenantId,
    string Email,
    string FirstName);
