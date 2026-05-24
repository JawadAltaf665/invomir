namespace InvoMir.Application.Interfaces;

public interface ICurrencyConversionService
{
    Task<IReadOnlyList<CurrencyConversionResult>> ConvertAsync(
        IReadOnlyList<CurrencyAmount> amounts,
        string targetCurrency,
        CancellationToken cancellationToken);
}

public sealed record CurrencyAmount(
    decimal Amount,
    string Currency);

public sealed record CurrencyConversionResult(
    decimal OriginalAmount,
    string OriginalCurrency,
    decimal ConvertedAmount,
    string TargetCurrency,
    decimal ExchangeRate,
    DateTimeOffset? RatesUpdatedAt);
