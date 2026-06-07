namespace InvoMir.Shared.Constants;

public static class LanguageConstants
{
    public const string Default = "en";

    public static readonly string[] Supported =
    [
        "en",
        "fr",
        "de",
        "es",
        "pt-BR",
        "ar",
        "it",
        "nl",
        "ur",
        "ja",
        "ru",
        "hi"
    ];

    public static bool TryNormalize(string? language, out string normalizedLanguage)
    {
        normalizedLanguage = Supported.FirstOrDefault(
            supportedLanguage => string.Equals(
                supportedLanguage,
                language?.Trim(),
                StringComparison.OrdinalIgnoreCase)) ?? string.Empty;

        return normalizedLanguage.Length > 0;
    }
}
