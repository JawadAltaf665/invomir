namespace InvoMir.Infrastructure.Settings;

public sealed class StripeSettings
{
    public const string SectionName = "Stripe";

    public string SecretKey { get; init; } = string.Empty;
    public string WebhookSecret { get; init; } = string.Empty;
    public string ConnectClientId { get; init; } = string.Empty;
    public string ConnectRedirectUrl { get; init; } = string.Empty;
    public string CheckoutSuccessUrl { get; init; } = "http://localhost:4200/pay/success?session_id={CHECKOUT_SESSION_ID}";
    public string CheckoutCancelUrl { get; init; } = "http://localhost:4200/pay/{TOKEN}";
}
