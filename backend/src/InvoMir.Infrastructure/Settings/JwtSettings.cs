namespace InvoMir.Infrastructure.Settings;

public sealed class JwtSettings
{
    public const string SectionName = "Jwt";

    public string Secret { get; init; } = string.Empty;
    public string Key { get; init; } = string.Empty;
    public string Issuer { get; init; } = "invomir";
    public string Audience { get; init; } = "invomir-users";
    public int AccessTokenExpiryMinutes { get; init; } = 15;
    public int RefreshTokenExpiryDays { get; init; } = 7;

    public string SigningSecret => string.IsNullOrWhiteSpace(Secret) ? Key : Secret;
}
