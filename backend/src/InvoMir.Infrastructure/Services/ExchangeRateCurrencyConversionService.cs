namespace InvoMir.Infrastructure.Services;

public sealed class ExchangeRateCurrencyConversionService(
    IOptions<CurrencyExchangeSettings> options,
    ILogger<ExchangeRateCurrencyConversionService> logger)
    : ICurrencyConversionService
{
    private static readonly HttpClient HttpClient = new();
    private readonly CurrencyExchangeSettings _settings = options.Value;
    private readonly Dictionary<string, CachedRateTable> _cache = new(StringComparer.OrdinalIgnoreCase);
    private readonly SemaphoreSlim _cacheLock = new(1, 1);

    public async Task<IReadOnlyList<CurrencyConversionResult>> ConvertAsync(
        IReadOnlyList<CurrencyAmount> amounts,
        string targetCurrency,
        CancellationToken cancellationToken)
    {
        if (amounts.Count == 0)
            return [];

        var normalizedTarget = NormalizeCurrency(targetCurrency);
        var requiresExchangeRates = amounts
            .Select(amount => NormalizeCurrency(amount.Currency))
            .Any(currency => !string.Equals(currency, normalizedTarget, StringComparison.OrdinalIgnoreCase));

        var rateTable = requiresExchangeRates
            ? await GetRateTableAsync(normalizedTarget, cancellationToken)
            : CachedRateTable.Identity(normalizedTarget);

        return amounts
            .Select(amount => ConvertAmount(amount, normalizedTarget, rateTable))
            .ToList();
    }

    private async Task<CachedRateTable> GetRateTableAsync(
        string baseCurrency,
        CancellationToken cancellationToken)
    {
        var utcNow = DateTimeOffset.UtcNow;
        if (TryGetFreshCachedTable(baseCurrency, utcNow, out var cachedTable))
            return cachedTable;

        await _cacheLock.WaitAsync(cancellationToken);
        try
        {
            if (TryGetFreshCachedTable(baseCurrency, utcNow, out cachedTable))
                return cachedTable;

            try
            {
                var fetchedTable = await FetchRateTableAsync(baseCurrency, cancellationToken);
                _cache[baseCurrency] = fetchedTable;

                return fetchedTable;
            }
            catch (Exception exception) when (_cache.TryGetValue(baseCurrency, out var staleTable))
            {
                logger.LogWarning(
                    exception,
                    "Using stale exchange-rate cache for {BaseCurrency} after provider request failed.",
                    baseCurrency);

                return staleTable;
            }
        }
        finally
        {
            _cacheLock.Release();
        }
    }

    private bool TryGetFreshCachedTable(
        string baseCurrency,
        DateTimeOffset utcNow,
        out CachedRateTable rateTable)
    {
        if (_cache.TryGetValue(baseCurrency, out rateTable!) && rateTable.ExpiresAt > utcNow)
            return true;

        rateTable = null!;
        return false;
    }

    private async Task<CachedRateTable> FetchRateTableAsync(
        string baseCurrency,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, BuildEndpoint(baseCurrency));
        request.Headers.UserAgent.ParseAdd("InvoMir/1.0");

        using var timeoutTokenSource = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutTokenSource.CancelAfter(TimeSpan.FromSeconds(Math.Max(1, _settings.RequestTimeoutSeconds)));

        using var response = await HttpClient.SendAsync(request, timeoutTokenSource.Token);
        var content = await response.Content.ReadAsStringAsync(timeoutTokenSource.Token);

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException(
                FormattableString.Invariant(
                    $"Exchange-rate provider failed with HTTP {(int)response.StatusCode}."));

        using var document = JsonDocument.Parse(content);
        var root = document.RootElement;
        var result = root.TryGetProperty("result", out var resultElement)
            ? resultElement.GetString()
            : null;

        if (!string.Equals(result, "success", StringComparison.OrdinalIgnoreCase))
        {
            var errorType = root.TryGetProperty("error-type", out var errorElement)
                ? errorElement.GetString()
                : "unknown-error";

            throw new InvalidOperationException($"Exchange-rate provider returned {errorType}.");
        }

        var ratesElement = ResolveRatesElement(root);
        var rates = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            [baseCurrency] = 1
        };

        foreach (var rate in ratesElement.EnumerateObject())
        {
            if (rate.Value.ValueKind != JsonValueKind.Number)
                continue;

            var currency = TryNormalizeCurrency(rate.Name);
            if (currency is null)
                continue;

            var value = rate.Value.GetDecimal();
            if (value <= 0)
                continue;

            rates[currency] = value;
        }

        var fetchedAt = ReadUnixTime(root, "time_last_update_unix") ?? DateTimeOffset.UtcNow;
        var cacheMinutes = Math.Max(5, _settings.CacheMinutes);

        return new CachedRateTable(
            baseCurrency,
            rates,
            fetchedAt,
            DateTimeOffset.UtcNow.AddMinutes(cacheMinutes));
    }

    private Uri BuildEndpoint(string baseCurrency)
    {
        if (!string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            var baseUrl = _settings.ApiKeyBaseUrl.TrimEnd('/');
            var apiKey = Uri.EscapeDataString(_settings.ApiKey.Trim());

            return new Uri($"{baseUrl}/{apiKey}/latest/{baseCurrency}");
        }

        if (!_settings.OpenAccessEnabled)
            throw new InvalidOperationException("Currency exchange API key is not configured.");

        return new Uri($"{_settings.OpenAccessBaseUrl.TrimEnd('/')}/{baseCurrency}");
    }

    private static CurrencyConversionResult ConvertAmount(
        CurrencyAmount amount,
        string targetCurrency,
        CachedRateTable rateTable)
    {
        var sourceCurrency = NormalizeCurrency(amount.Currency);
        if (string.Equals(sourceCurrency, targetCurrency, StringComparison.OrdinalIgnoreCase))
        {
            return new CurrencyConversionResult(
                amount.Amount,
                sourceCurrency,
                RoundMoney(amount.Amount),
                targetCurrency,
                1,
                rateTable.UpdatedAt);
        }

        if (!rateTable.Rates.TryGetValue(sourceCurrency, out var targetToSourceRate) ||
            targetToSourceRate <= 0)
        {
            throw new InvalidOperationException(
                $"Exchange rate from {sourceCurrency} to {targetCurrency} is not available.");
        }

        var sourceToTargetRate = 1 / targetToSourceRate;
        var convertedAmount = amount.Amount * sourceToTargetRate;

        return new CurrencyConversionResult(
            amount.Amount,
            sourceCurrency,
            RoundMoney(convertedAmount),
            targetCurrency,
            sourceToTargetRate,
            rateTable.UpdatedAt);
    }

    private static JsonElement ResolveRatesElement(JsonElement root)
    {
        if (root.TryGetProperty("conversion_rates", out var conversionRatesElement) &&
            conversionRatesElement.ValueKind == JsonValueKind.Object)
        {
            return conversionRatesElement;
        }

        if (root.TryGetProperty("rates", out var ratesElement) &&
            ratesElement.ValueKind == JsonValueKind.Object)
        {
            return ratesElement;
        }

        throw new InvalidOperationException("Exchange-rate provider response did not include rates.");
    }

    private static DateTimeOffset? ReadUnixTime(JsonElement root, string propertyName)
    {
        return root.TryGetProperty(propertyName, out var property) &&
            property.ValueKind == JsonValueKind.Number &&
            property.TryGetInt64(out var unixTime)
                ? DateTimeOffset.FromUnixTimeSeconds(unixTime)
                : null;
    }

    private static string NormalizeCurrency(string currency)
    {
        var normalized = currency.Trim().ToUpperInvariant();
        if (normalized.Length != 3 || normalized.Any(character => character is < 'A' or > 'Z'))
            throw new InvalidOperationException($"Currency code '{currency}' is invalid.");

        return normalized;
    }

    private static string? TryNormalizeCurrency(string currency)
    {
        var normalized = currency.Trim().ToUpperInvariant();

        return normalized.Length == 3 && normalized.All(character => character is >= 'A' and <= 'Z')
            ? normalized
            : null;
    }

    private static decimal RoundMoney(decimal amount)
    {
        return decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
    }

    private sealed record CachedRateTable(
        string BaseCurrency,
        IReadOnlyDictionary<string, decimal> Rates,
        DateTimeOffset? UpdatedAt,
        DateTimeOffset ExpiresAt)
    {
        public static CachedRateTable Identity(string baseCurrency)
        {
            return new CachedRateTable(
                baseCurrency,
                new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
                {
                    [baseCurrency] = 1
                },
                null,
                DateTimeOffset.MaxValue);
        }
    }
}
