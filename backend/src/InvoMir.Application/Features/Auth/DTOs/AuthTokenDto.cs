using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Auth.DTOs;

public sealed record AuthTokenDto(
    [property: JsonPropertyName("accessToken")]
    string AccessToken,
    [property: JsonPropertyName("refreshToken")]
    string RefreshToken,
    [property: JsonPropertyName("accessTokenExpiresAt")]
    DateTime AccessTokenExpiresAt,
    [property: JsonPropertyName("userId")]
    Guid UserId,
    [property: JsonPropertyName("tenantId")]
    Guid TenantId,
    [property: JsonPropertyName("email")]
    string Email,
    [property: JsonPropertyName("firstName")]
    string FirstName,
    [property: JsonPropertyName("trialEndsAt")]
    DateTime? TrialEndsAt,
    [property: JsonPropertyName("plan")]
    string Plan);
