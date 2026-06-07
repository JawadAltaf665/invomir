namespace InvoMir.Application.Features.Auth.DTOs;

public sealed record AuthTokenDto(
    string AccessToken,
    DateTime AccessTokenExpiresAt,
    Guid UserId,
    Guid TenantId,
    string Email,
    string FirstName,
    DateTime? TrialEndsAt,
    string Plan,
    string Role,
    IReadOnlyCollection<string> Permissions);
