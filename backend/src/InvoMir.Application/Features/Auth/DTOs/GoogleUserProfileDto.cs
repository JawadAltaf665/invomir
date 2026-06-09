namespace InvoMir.Application.Features.Auth.DTOs;

public sealed record GoogleUserProfileDto(
    string ProviderId,
    string Email,
    string Name,
    string? GivenName,
    string? FamilyName,
    string? PictureUrl);
