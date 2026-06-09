using System.Text.Json.Serialization;

namespace InvoMir.Infrastructure.Services;

public sealed class GoogleAuthService(
    HttpClient httpClient,
    IOptions<GoogleAuthSettings> googleAuthSettings,
    ILogger<GoogleAuthService> logger)
    : IGoogleAuthService
{
    private readonly GoogleAuthSettings _settings = googleAuthSettings.Value;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_settings.ClientId);

    public async Task<GoogleUserProfileDto?> VerifyIdTokenAsync(
        string idToken,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured)
            return null;

        try
        {
            var tokenInfoUri = $"{_settings.TokenInfoUrl}?id_token={Uri.EscapeDataString(idToken)}";
            await using var stream = await httpClient.GetStreamAsync(tokenInfoUri, cancellationToken);
            var tokenInfo = await JsonSerializer.DeserializeAsync<GoogleTokenInfoResponse>(
                stream,
                new JsonSerializerOptions(JsonSerializerDefaults.Web),
                cancellationToken);

            if (tokenInfo is null ||
                !string.Equals(tokenInfo.Audience, _settings.ClientId, StringComparison.Ordinal) ||
                !IsEmailVerified(tokenInfo.EmailVerified) ||
                string.IsNullOrWhiteSpace(tokenInfo.Subject) ||
                string.IsNullOrWhiteSpace(tokenInfo.Email))
            {
                return null;
            }

            return new GoogleUserProfileDto(
                tokenInfo.Subject.Trim(),
                tokenInfo.Email.ToLowerInvariant().Trim(),
                tokenInfo.Name?.Trim() ?? string.Empty,
                tokenInfo.GivenName?.Trim(),
                tokenInfo.FamilyName?.Trim(),
                tokenInfo.Picture?.Trim());
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(exception, "Google ID token verification request failed.");
            return null;
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "Google ID token verification response could not be parsed.");
            return null;
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning(exception, "Google ID token verification timed out.");
            return null;
        }
    }

    private static bool IsEmailVerified(JsonElement value)
    {
        return value.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.String => bool.TryParse(value.GetString(), out var parsed) && parsed,
            _ => false
        };
    }

    private sealed class GoogleTokenInfoResponse
    {
        [JsonPropertyName("aud")]
        public string? Audience { get; init; }

        [JsonPropertyName("sub")]
        public string? Subject { get; init; }

        [JsonPropertyName("email")]
        public string? Email { get; init; }

        [JsonPropertyName("email_verified")]
        public JsonElement EmailVerified { get; init; }

        [JsonPropertyName("name")]
        public string? Name { get; init; }

        [JsonPropertyName("given_name")]
        public string? GivenName { get; init; }

        [JsonPropertyName("family_name")]
        public string? FamilyName { get; init; }

        [JsonPropertyName("picture")]
        public string? Picture { get; init; }
    }
}
