namespace InvoMir.Application.Interfaces;

public interface IStripeService
{
    Task<StripeCheckoutSessionDto> CreateCheckoutSessionAsync(
        StripeCheckoutSessionRequestDto request,
        CancellationToken cancellationToken);

    Task<StripeCheckoutSessionDto> CreateSubscriptionCheckoutSessionAsync(
        StripeSubscriptionCheckoutRequestDto request,
        CancellationToken cancellationToken);

    Task<StripeSubscriptionCancellationDto> CancelSubscriptionAtPeriodEndAsync(
        string stripeSubscriptionId,
        CancellationToken cancellationToken);

    StripeConnectUrlDto CreateConnectOAuthUrl(StripeConnectOAuthRequestDto request);

    StripeWebhookEventDto ConstructWebhookEvent(string payload, string signatureHeader);
}
