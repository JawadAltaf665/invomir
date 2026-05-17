namespace InvoMir.Infrastructure.Services;

public sealed class StripeService(
    IOptions<StripeSettings> settings,
    ILogger<StripeService> logger)
    : IStripeService
{
    private const string CheckoutSessionsUrl = "https://api.stripe.com/v1/checkout/sessions";
    private const int WebhookToleranceSeconds = 300;
    private static readonly HttpClient HttpClient = new();
    private readonly StripeSettings _settings = settings.Value;

    public async Task<StripeCheckoutSessionDto> CreateCheckoutSessionAsync(
        StripeCheckoutSessionRequestDto request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_settings.SecretKey))
            throw new BadRequestException("Stripe is not configured.");

        var amountInMinorUnits = ConvertToMinorUnits(request.Amount);
        var successUrl = _settings.CheckoutSuccessUrl;
        var cancelUrl = _settings.CheckoutCancelUrl.Replace(
            "{TOKEN}",
            Uri.EscapeDataString(request.PaymentLinkToken),
            StringComparison.Ordinal);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, CheckoutSessionsUrl)
        {
            Content = new FormUrlEncodedContent(BuildCheckoutFields(request, amountInMinorUnits, successUrl, cancelUrl))
        };

        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.SecretKey);

        using var response = await HttpClient.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "Stripe checkout session failed with status {StatusCode}: {ResponseBody}",
                response.StatusCode,
                body);

            throw new BadRequestException("Unable to create Stripe checkout session.");
        }

        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;
        var id = root.GetProperty("id").GetString();
        var url = root.GetProperty("url").GetString();

        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(url))
            throw new BadRequestException("Stripe checkout session response was invalid.");

        return new StripeCheckoutSessionDto(id, url);
    }

    public StripeWebhookEventDto ConstructWebhookEvent(string payload, string signatureHeader)
    {
        if (string.IsNullOrWhiteSpace(_settings.WebhookSecret))
            throw new BadRequestException("Stripe webhook secret is not configured.");

        var timestamp = GetTimestamp(signatureHeader);
        if (Math.Abs(DateTimeOffset.UtcNow.ToUnixTimeSeconds() - timestamp) > WebhookToleranceSeconds)
            throw new BadRequestException("Stripe webhook signature timestamp is outside the allowed tolerance.");

        var expectedSignature = ComputeSignature(timestamp, payload);
        if (!HasValidSignature(signatureHeader, expectedSignature))
            throw new BadRequestException("Invalid Stripe webhook signature.");

        using var document = JsonDocument.Parse(payload);
        var root = document.RootElement;
        var eventId = root.GetProperty("id").GetString() ?? string.Empty;
        var eventType = root.GetProperty("type").GetString() ?? string.Empty;
        var paymentIntent = TryReadPaymentIntent(eventType, root);

        return new StripeWebhookEventDto(eventId, eventType, paymentIntent);
    }

    private static Dictionary<string, string> BuildCheckoutFields(
        StripeCheckoutSessionRequestDto request,
        long amountInMinorUnits,
        string successUrl,
        string cancelUrl)
    {
        return new Dictionary<string, string>
        {
            ["mode"] = "payment",
            ["payment_method_types[0]"] = "card",
            ["line_items[0][quantity]"] = "1",
            ["line_items[0][price_data][currency]"] = request.Currency.ToLowerInvariant(),
            ["line_items[0][price_data][unit_amount]"] = amountInMinorUnits.ToString(CultureInfo.InvariantCulture),
            ["line_items[0][price_data][product_data][name]"] = $"Invoice {request.InvoiceNumber}",
            ["payment_intent_data[metadata][invoice_id]"] = request.InvoiceId.ToString(),
            ["payment_intent_data[metadata][tenant_id]"] = request.TenantId.ToString(),
            ["payment_intent_data[metadata][payment_link_token]"] = request.PaymentLinkToken,
            ["metadata[invoice_id]"] = request.InvoiceId.ToString(),
            ["metadata[tenant_id]"] = request.TenantId.ToString(),
            ["success_url"] = successUrl,
            ["cancel_url"] = cancelUrl
        };
    }

    private static long ConvertToMinorUnits(decimal amount)
    {
        return decimal.ToInt64(decimal.Round(amount * 100, 0, MidpointRounding.AwayFromZero));
    }

    private static long GetTimestamp(string signatureHeader)
    {
        var timestampValue = signatureHeader
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(part => part.StartsWith("t=", StringComparison.Ordinal));

        if (timestampValue is null || !long.TryParse(timestampValue[2..], out var timestamp))
            throw new BadRequestException("Stripe webhook signature timestamp is missing.");

        return timestamp;
    }

    private string ComputeSignature(long timestamp, string payload)
    {
        var signedPayload = $"{timestamp}.{payload}";
        var secretBytes = Encoding.UTF8.GetBytes(_settings.WebhookSecret);
        var payloadBytes = Encoding.UTF8.GetBytes(signedPayload);
        var hashBytes = HMACSHA256.HashData(secretBytes, payloadBytes);

        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    private static bool HasValidSignature(string signatureHeader, string expectedSignature)
    {
        var expectedBytes = Encoding.UTF8.GetBytes(expectedSignature);
        var signatures = signatureHeader
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(part => part.StartsWith("v1=", StringComparison.Ordinal))
            .Select(part => part[3..]);

        foreach (var signature in signatures)
        {
            var actualBytes = Encoding.UTF8.GetBytes(signature);
            if (actualBytes.Length == expectedBytes.Length &&
                CryptographicOperations.FixedTimeEquals(actualBytes, expectedBytes))
            {
                return true;
            }
        }

        return false;
    }

    private static StripePaymentIntentDto? TryReadPaymentIntent(string eventType, JsonElement root)
    {
        if (!eventType.StartsWith("payment_intent.", StringComparison.Ordinal))
            return null;

        var paymentIntent = root.GetProperty("data").GetProperty("object");
        var id = paymentIntent.GetProperty("id").GetString() ?? string.Empty;
        var amount = paymentIntent.TryGetProperty("amount", out var amountElement)
            ? amountElement.GetInt64() / 100m
            : 0;
        var currency = paymentIntent.TryGetProperty("currency", out var currencyElement)
            ? currencyElement.GetString()?.ToUpperInvariant() ?? string.Empty
            : string.Empty;
        var status = paymentIntent.TryGetProperty("status", out var statusElement)
            ? statusElement.GetString() ?? string.Empty
            : string.Empty;
        var latestChargeId = paymentIntent.TryGetProperty("latest_charge", out var chargeElement) &&
            chargeElement.ValueKind == JsonValueKind.String
            ? chargeElement.GetString()
            : null;
        var failureReason = TryReadFailureReason(paymentIntent);
        var invoiceId = TryReadInvoiceId(paymentIntent);

        return new StripePaymentIntentDto(
            id,
            invoiceId,
            amount,
            currency,
            status,
            latestChargeId,
            failureReason,
            DateTime.UtcNow);
    }

    private static Guid? TryReadInvoiceId(JsonElement paymentIntent)
    {
        if (!paymentIntent.TryGetProperty("metadata", out var metadata) ||
            !metadata.TryGetProperty("invoice_id", out var invoiceIdElement))
        {
            return null;
        }

        return Guid.TryParse(invoiceIdElement.GetString(), out var invoiceId)
            ? invoiceId
            : null;
    }

    private static string? TryReadFailureReason(JsonElement paymentIntent)
    {
        if (!paymentIntent.TryGetProperty("last_payment_error", out var error) ||
            error.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
        {
            return null;
        }

        if (error.TryGetProperty("message", out var message))
            return message.GetString();

        return null;
    }
}
