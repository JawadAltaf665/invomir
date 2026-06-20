namespace InvoMir.Infrastructure.Settings;

public sealed class StripeSettings
{
    public const string SectionName = "Stripe";

    public string SecretKey { get; init; } = string.Empty;
    public string WebhookSecret { get; init; } = string.Empty;
    public string ConnectClientId { get; init; } = string.Empty;
    public string ConnectRedirectUrl { get; init; } = string.Empty;
    public string ConnectSuccessRedirectUrl { get; init; } = "https://invomir.com/settings?stripe=connected";
    public string CheckoutSuccessUrl { get; init; } = "http://localhost:4200/pay/success?session_id={CHECKOUT_SESSION_ID}";
    public string CheckoutCancelUrl { get; init; } = "http://localhost:4200/pay/{TOKEN}";
    public string SubscriptionSuccessUrl { get; init; } = "http://localhost:4200/billing/success?session_id={CHECKOUT_SESSION_ID}";
    public string SubscriptionCancelUrl { get; init; } = "http://localhost:4200/billing";
    public string SubscriptionPortalReturnUrl { get; init; } = "http://localhost:4200/app/subscriptions";
    public string StarterMonthlyPriceId { get; init; } = string.Empty;
    public string StarterYearlyPriceId { get; init; } = string.Empty;
    public string ProfessionalMonthlyPriceId { get; init; } = string.Empty;
    public string ProfessionalYearlyPriceId { get; init; } = string.Empty;
    public string BusinessMonthlyPriceId { get; init; } = string.Empty;
    public string BusinessYearlyPriceId { get; init; } = string.Empty;
}
