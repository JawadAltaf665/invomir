namespace InvoMir.Infrastructure.Services;

public sealed class StripeService(
    IOptions<StripeSettings> settings,
    ILogger<StripeService> logger)
    : IStripeService
{
    private const string CheckoutSessionsUrl = "https://api.stripe.com/v1/checkout/sessions";
    private const string ConnectAuthorizeUrl = "https://connect.stripe.com/oauth/authorize";
    private const string SubscriptionsUrl = "https://api.stripe.com/v1/subscriptions";
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

    public async Task<StripeCheckoutSessionDto> CreateSubscriptionCheckoutSessionAsync(
        StripeSubscriptionCheckoutRequestDto request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_settings.SecretKey))
            throw new BadRequestException("Stripe is not configured.");

        var priceId = ResolveSubscriptionPriceId(request.Plan, request.Interval);
        if (string.IsNullOrWhiteSpace(priceId))
            throw new BadRequestException("Stripe subscription price is not configured.");

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, CheckoutSessionsUrl)
        {
            Content = new FormUrlEncodedContent(BuildSubscriptionCheckoutFields(request, priceId))
        };

        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.SecretKey);

        using var response = await HttpClient.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "Stripe subscription checkout failed with status {StatusCode}: {ResponseBody}",
                response.StatusCode,
                body);

            throw new BadRequestException("Unable to create subscription checkout session.");
        }

        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;
        var id = root.GetProperty("id").GetString();
        var url = root.GetProperty("url").GetString();

        if (string.IsNullOrWhiteSpace(id) || string.IsNullOrWhiteSpace(url))
            throw new BadRequestException("Stripe subscription checkout response was invalid.");

        return new StripeCheckoutSessionDto(id, url);
    }

    public async Task<StripeSubscriptionCancellationDto> CancelSubscriptionAtPeriodEndAsync(
        string stripeSubscriptionId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_settings.SecretKey))
            throw new BadRequestException("Stripe is not configured.");

        if (string.IsNullOrWhiteSpace(stripeSubscriptionId))
            throw new BadRequestException("Stripe subscription id is required.");

        var subscriptionUrl = $"{SubscriptionsUrl}/{Uri.EscapeDataString(stripeSubscriptionId.Trim())}";
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, subscriptionUrl)
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["cancel_at_period_end"] = "true"
            })
        };

        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.SecretKey);

        using var response = await HttpClient.SendAsync(httpRequest, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "Stripe subscription cancellation failed with status {StatusCode}: {ResponseBody}",
                response.StatusCode,
                body);

            throw new BadRequestException("Unable to cancel subscription.");
        }

        using var document = JsonDocument.Parse(body);
        var root = document.RootElement;
        var id = root.GetProperty("id").GetString() ?? stripeSubscriptionId;
        var status = root.TryGetProperty("status", out var statusElement)
            ? NormalizeStripeSubscriptionStatus(statusElement.GetString())
            : SubscriptionConstants.Statuses.Cancelled;
        var cancelAtPeriodEnd = root.TryGetProperty("cancel_at_period_end", out var cancelAtPeriodEndElement) &&
            cancelAtPeriodEndElement.GetBoolean();
        var currentPeriodEnd = TryReadUnixTime(root, "current_period_end");
        var cancelledAt = TryReadUnixTime(root, "canceled_at") ?? DateTime.UtcNow;

        return new StripeSubscriptionCancellationDto(
            id,
            status,
            cancelAtPeriodEnd,
            currentPeriodEnd,
            cancelledAt);
    }

    public StripeConnectUrlDto CreateConnectOAuthUrl(StripeConnectOAuthRequestDto request)
    {
        if (string.IsNullOrWhiteSpace(_settings.ConnectClientId))
            throw new BadRequestException("Stripe Connect is not configured.");

        if (string.IsNullOrWhiteSpace(request.State))
            throw new BadRequestException("Stripe Connect state is required.");

        var fields = new Dictionary<string, string>
        {
            ["response_type"] = "code",
            ["client_id"] = _settings.ConnectClientId.Trim(),
            ["scope"] = "read_write",
            ["state"] = request.State
        };

        if (!string.IsNullOrWhiteSpace(_settings.ConnectRedirectUrl))
            fields["redirect_uri"] = _settings.ConnectRedirectUrl.Trim();

        var oauthUrl = $"{ConnectAuthorizeUrl}?{BuildQueryString(fields)}";
        return new StripeConnectUrlDto(oauthUrl, request.State);
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
        var subscriptionCheckoutSession = TryReadSubscriptionCheckoutSession(eventType, root);
        var subscription = TryReadSubscription(eventType, root);

        return new StripeWebhookEventDto(
            eventId,
            eventType,
            paymentIntent,
            subscriptionCheckoutSession,
            subscription);
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

    private Dictionary<string, string> BuildSubscriptionCheckoutFields(
        StripeSubscriptionCheckoutRequestDto request,
        string priceId)
    {
        var fields = new Dictionary<string, string>
        {
            ["mode"] = "subscription",
            ["line_items[0][price]"] = priceId,
            ["line_items[0][quantity]"] = "1",
            ["client_reference_id"] = request.UserId.ToString(),
            ["metadata[user_id]"] = request.UserId.ToString(),
            ["metadata[tenant_id]"] = request.TenantId.ToString(),
            ["metadata[plan]"] = request.Plan,
            ["metadata[interval]"] = request.Interval,
            ["subscription_data[metadata][user_id]"] = request.UserId.ToString(),
            ["subscription_data[metadata][tenant_id]"] = request.TenantId.ToString(),
            ["subscription_data[metadata][plan]"] = request.Plan,
            ["subscription_data[metadata][interval]"] = request.Interval,
            ["success_url"] = _settings.SubscriptionSuccessUrl,
            ["cancel_url"] = _settings.SubscriptionCancelUrl
        };

        if (string.IsNullOrWhiteSpace(request.StripeCustomerId))
            fields["customer_email"] = request.UserEmail;
        else
            fields["customer"] = request.StripeCustomerId.Trim();

        return fields;
    }

    private string ResolveSubscriptionPriceId(string plan, string interval)
    {
        return (plan, interval) switch
        {
            (AuthConstants.Plans.Starter, SubscriptionConstants.Intervals.Month) => _settings.StarterMonthlyPriceId,
            (AuthConstants.Plans.Starter, SubscriptionConstants.Intervals.Year) => _settings.StarterYearlyPriceId,
            (AuthConstants.Plans.Professional, SubscriptionConstants.Intervals.Month) => _settings.ProfessionalMonthlyPriceId,
            (AuthConstants.Plans.Professional, SubscriptionConstants.Intervals.Year) => _settings.ProfessionalYearlyPriceId,
            (AuthConstants.Plans.Business, SubscriptionConstants.Intervals.Month) => _settings.BusinessMonthlyPriceId,
            (AuthConstants.Plans.Business, SubscriptionConstants.Intervals.Year) => _settings.BusinessYearlyPriceId,
            _ => string.Empty
        };
    }

    private static string BuildQueryString(IReadOnlyDictionary<string, string> fields)
    {
        return string.Join(
            "&",
            fields.Select(field =>
                $"{Uri.EscapeDataString(field.Key)}={Uri.EscapeDataString(field.Value)}"));
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

    private static StripeSubscriptionCheckoutCompletedDto? TryReadSubscriptionCheckoutSession(
        string eventType,
        JsonElement root)
    {
        if (eventType != "checkout.session.completed")
            return null;

        var session = root.GetProperty("data").GetProperty("object");
        var mode = session.TryGetProperty("mode", out var modeElement)
            ? modeElement.GetString()
            : null;

        if (!string.Equals(mode, "subscription", StringComparison.Ordinal))
            return null;

        var subscriptionId = TryReadString(session, "subscription");
        if (string.IsNullOrWhiteSpace(subscriptionId))
            return null;

        return new StripeSubscriptionCheckoutCompletedDto(
            TryReadString(session, "id") ?? string.Empty,
            subscriptionId,
            TryReadString(session, "customer"),
            TryReadGuidMetadata(session, "tenant_id"),
            TryReadGuidMetadata(session, "user_id"),
            TryReadMetadata(session, "plan"),
            TryReadMetadata(session, "interval"));
    }

    private static StripeSubscriptionEventDto? TryReadSubscription(string eventType, JsonElement root)
    {
        return eventType switch
        {
            string subscriptionEvent when subscriptionEvent.StartsWith("customer.subscription.", StringComparison.Ordinal) =>
                TryReadCustomerSubscription(root),
            "invoice.payment_failed" => TryReadInvoicePaymentFailedSubscription(root),
            _ => null
        };
    }

    private static StripeSubscriptionEventDto? TryReadCustomerSubscription(JsonElement root)
    {
        var subscription = root.GetProperty("data").GetProperty("object");
        var subscriptionId = TryReadString(subscription, "id");

        if (string.IsNullOrWhiteSpace(subscriptionId))
            return null;

        var (amount, currency, interval) = TryReadSubscriptionPricing(subscription);
        var status = NormalizeStripeSubscriptionStatus(TryReadString(subscription, "status"));
        var periodStart = TryReadUnixTime(subscription, "current_period_start") ?? DateTime.UtcNow;
        var periodEnd = TryReadUnixTime(subscription, "current_period_end") ??
            (interval == SubscriptionConstants.Intervals.Year ? periodStart.AddYears(1) : periodStart.AddMonths(1));
        var cancelAtPeriodEnd = subscription.TryGetProperty("cancel_at_period_end", out var cancelElement) &&
            cancelElement.ValueKind == JsonValueKind.True;

        return new StripeSubscriptionEventDto(
            subscriptionId,
            TryReadString(subscription, "customer"),
            TryReadGuidMetadata(subscription, "tenant_id"),
            TryReadGuidMetadata(subscription, "user_id"),
            TryReadMetadata(subscription, "plan"),
            TryReadMetadata(subscription, "interval") ?? interval,
            status,
            amount,
            currency,
            periodStart,
            periodEnd,
            cancelAtPeriodEnd,
            TryReadUnixTime(subscription, "canceled_at"));
    }

    private static StripeSubscriptionEventDto? TryReadInvoicePaymentFailedSubscription(JsonElement root)
    {
        var invoice = root.GetProperty("data").GetProperty("object");
        var subscriptionId = TryReadString(invoice, "subscription");

        if (string.IsNullOrWhiteSpace(subscriptionId))
            return null;

        var periodStart = DateTime.UtcNow;

        return new StripeSubscriptionEventDto(
            subscriptionId,
            TryReadString(invoice, "customer"),
            TryReadGuidMetadata(invoice, "tenant_id"),
            TryReadGuidMetadata(invoice, "user_id"),
            TryReadMetadata(invoice, "plan"),
            TryReadMetadata(invoice, "interval"),
            SubscriptionConstants.Statuses.PastDue,
            0,
            TryReadString(invoice, "currency")?.ToUpperInvariant() ?? "USD",
            periodStart,
            periodStart,
            false,
            null);
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

    private static string? TryReadMetadata(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty("metadata", out var metadata) ||
            metadata.ValueKind != JsonValueKind.Object ||
            !metadata.TryGetProperty(propertyName, out var property))
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }

    private static Guid? TryReadGuidMetadata(JsonElement root, string propertyName)
    {
        var value = TryReadMetadata(root, propertyName);
        return Guid.TryParse(value, out var guid) ? guid : null;
    }

    private static string? TryReadString(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var property) ||
            property.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
        {
            return null;
        }

        return property.ValueKind == JsonValueKind.String
            ? property.GetString()
            : null;
    }

    private static (decimal Amount, string Currency, string Interval) TryReadSubscriptionPricing(JsonElement subscription)
    {
        if (!subscription.TryGetProperty("items", out var items) ||
            !items.TryGetProperty("data", out var data) ||
            data.ValueKind != JsonValueKind.Array)
        {
            return (0, "USD", SubscriptionConstants.Intervals.Month);
        }

        var item = data.EnumerateArray().FirstOrDefault();
        if (item.ValueKind == JsonValueKind.Undefined ||
            !item.TryGetProperty("price", out var price))
        {
            return (0, "USD", SubscriptionConstants.Intervals.Month);
        }

        var amount = price.TryGetProperty("unit_amount", out var amountElement) &&
            amountElement.TryGetInt64(out var unitAmount)
            ? unitAmount / 100m
            : 0;
        var currency = TryReadString(price, "currency")?.ToUpperInvariant() ?? "USD";
        var interval = SubscriptionConstants.Intervals.Month;

        if (price.TryGetProperty("recurring", out var recurring))
        {
            interval = NormalizeSubscriptionInterval(TryReadString(recurring, "interval"));
        }

        return (amount, currency, interval);
    }

    private static DateTime? TryReadUnixTime(JsonElement root, string propertyName)
    {
        if (!root.TryGetProperty(propertyName, out var value) ||
            value.ValueKind is JsonValueKind.Null or JsonValueKind.Undefined)
        {
            return null;
        }

        return value.TryGetInt64(out var unixTime)
            ? DateTimeOffset.FromUnixTimeSeconds(unixTime).UtcDateTime
            : null;
    }

    private static string NormalizeStripeSubscriptionStatus(string? status)
    {
        return status switch
        {
            "active" => SubscriptionConstants.Statuses.Active,
            "trialing" => SubscriptionConstants.Statuses.Trialing,
            "past_due" or "unpaid" or "incomplete" or "incomplete_expired" => SubscriptionConstants.Statuses.PastDue,
            "canceled" or "cancelled" => SubscriptionConstants.Statuses.Cancelled,
            _ => SubscriptionConstants.Statuses.PastDue
        };
    }

    private static string NormalizeSubscriptionInterval(string? interval)
    {
        return interval switch
        {
            SubscriptionConstants.Intervals.Year => SubscriptionConstants.Intervals.Year,
            _ => SubscriptionConstants.Intervals.Month
        };
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
