namespace InvoMir.Application.Features.Auth.DTOs;

public sealed record AuthTokenDto(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAt,
    Guid UserId,
    Guid TenantId,
    string Email,
    string FirstName,
    DateTime? TrialEndsAt,
    string Plan);
