using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Users.DTOs;

public sealed record UserLogoDto(
    [property: JsonPropertyName("logo_url")] string LogoUrl);
