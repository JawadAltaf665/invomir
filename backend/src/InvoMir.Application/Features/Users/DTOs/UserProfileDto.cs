namespace InvoMir.Application.Features.Users.DTOs;

public sealed record UserProfileDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string BusinessName,
    string? LogoUrl,
    string? ProfilePictureUrl,
    string Currency,
    decimal TaxPercent,
    string Plan,
    string Role,
    string? StripeAccountId,
    bool EmailVerified,
    DateTime? LastLoginAt,
    DateTime? TrialEndsAt,
    DateTime CreatedAt);
