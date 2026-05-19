namespace InvoMir.Shared.Constants;

public static class RateLimitPolicies
{
    public const string AuthStrict = "auth_strict";
    public const string AuthToken = "auth_token";
    public const string ApiAuthenticated = "api_authenticated";
    public const string InvoiceActions = "invoice_actions";
    public const string StripeWebhooks = "stripe_webhooks";
    public const string PublicPaymentPages = "public_payment_pages";
    public const string Subscriptions = "subscriptions";
    public const string AdminEndpoints = "admin_endpoints";
    public const string GlobalFallback = "global_fallback";
}
