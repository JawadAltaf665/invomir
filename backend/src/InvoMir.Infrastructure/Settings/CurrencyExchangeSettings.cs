namespace InvoMir.Infrastructure.Settings;

public sealed class CurrencyExchangeSettings
{
    public const string SectionName = "CurrencyExchange";

    public string Provider { get; init; } = "ExchangeRateApi";

    public string ApiKey { get; init; } = string.Empty;

    public bool OpenAccessEnabled { get; init; } = true;

    public string OpenAccessBaseUrl { get; init; } = "https://open.er-api.com/v6/latest";

    public string ApiKeyBaseUrl { get; init; } = "https://v6.exchangerate-api.com/v6";

    public int RequestTimeoutSeconds { get; init; } = 10;

    public int CacheMinutes { get; init; } = 720;
}
