using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Users.DTOs;

public sealed record UserProfileDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("first_name")] string FirstName,
    [property: JsonPropertyName("last_name")] string LastName,
    [property: JsonPropertyName("business_name")] string BusinessName,
    [property: JsonPropertyName("logo_url")] string? LogoUrl,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("tax_percent")] decimal TaxPercent,
    [property: JsonPropertyName("plan")] string Plan,
    [property: JsonPropertyName("role")] string Role,
    [property: JsonPropertyName("stripe_account_id")] string? StripeAccountId,
    [property: JsonPropertyName("email_verified")] bool EmailVerified,
    [property: JsonPropertyName("last_login_at")] DateTime? LastLoginAt,
    [property: JsonPropertyName("trial_ends_at")] DateTime? TrialEndsAt,
    [property: JsonPropertyName("created_at")] DateTime CreatedAt);
