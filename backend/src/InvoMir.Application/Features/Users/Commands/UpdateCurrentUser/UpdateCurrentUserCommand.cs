using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Users.Commands.UpdateCurrentUser;

public sealed record UpdateCurrentUserCommand : IRequest<UserProfileDto>
{
    [JsonPropertyName("business_name")]
    public string? BusinessName { get; init; }

    [JsonPropertyName("currency")]
    public string? Currency { get; init; }

    [JsonPropertyName("tax_percent")]
    public decimal? TaxPercent { get; init; }
}
