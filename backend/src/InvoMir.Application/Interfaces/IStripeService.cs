namespace InvoMir.Application.Interfaces;

public interface IStripeService
{
    Task<StripeCheckoutSessionDto> CreateCheckoutSessionAsync(
        StripeCheckoutSessionRequestDto request,
        CancellationToken cancellationToken);

    Task<StripeCheckoutSessionDto> CreateSubscriptionCheckoutSessionAsync(
        StripeSubscriptionCheckoutRequestDto request,
        CancellationToken cancellationToken);

    bool IsSubscriptionCheckoutConfigured(string plan, string interval);

    Task<StripeSubscriptionCancellationDto> CancelSubscriptionAtPeriodEndAsync(
        string stripeSubscriptionId,
        CancellationToken cancellationToken);

    StripeConnectUrlDto CreateConnectOAuthUrl(StripeConnectOAuthRequestDto request);

    Task<StripeConnectAccountDto> ExchangeConnectAuthorizationCodeAsync(
        string code,
        CancellationToken cancellationToken);

    string GetConnectSuccessRedirectUrl();

    StripeWebhookEventDto ConstructWebhookEvent(string payload, string signatureHeader);
}
