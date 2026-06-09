namespace InvoMir.Infrastructure.Settings;

public sealed class GoogleAuthSettings
{
    public const string SectionName = "GoogleAuth";

    public string ClientId { get; init; } = string.Empty;
    public string TokenInfoUrl { get; init; } = "https://oauth2.googleapis.com/tokeninfo";
    public int RequestTimeoutSeconds { get; init; } = 10;
}
