namespace InvoMir.Application.Interfaces;

public interface IStripeService
{
    Task<StripeCheckoutSessionDto> CreateCheckoutSessionAsync(
        StripeCheckoutSessionRequestDto request,
        CancellationToken cancellationToken);

    StripeConnectUrlDto CreateConnectOAuthUrl(StripeConnectOAuthRequestDto request);

    StripeWebhookEventDto ConstructWebhookEvent(string payload, string signatureHeader);
}
