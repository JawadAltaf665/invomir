namespace InvoMir.Infrastructure.Services;

public sealed class InvoiceLinkBuilder(IOptions<SendGridSettings> settings) : IInvoiceLinkBuilder
{
    private readonly SendGridSettings _settings = settings.Value;

    public string BuildPaymentLink(string token)
    {
        return BuildTokenUrl(_settings.PaymentBaseUrl, token);
    }

    public string BuildTrackingPixelUrl(string token)
    {
        var trackingBaseUrl = $"{_settings.ApiBaseUrl.TrimEnd('/')}/api/invoices/track";
        return BuildTokenUrl(trackingBaseUrl, token);
    }

    private static string BuildTokenUrl(string baseUrl, string token)
    {
        return $"{baseUrl.TrimEnd('/')}/{Uri.EscapeDataString(token)}";
    }
}
