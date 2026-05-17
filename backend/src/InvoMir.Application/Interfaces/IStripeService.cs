namespace InvoMir.Application.Interfaces;

public interface IStripeService
{
    Task<StripeCheckoutSessionDto> CreateCheckoutSessionAsync(
        StripeCheckoutSessionRequestDto request,
        CancellationToken cancellationToken);

    StripeWebhookEventDto ConstructWebhookEvent(string payload, string signatureHeader);
}
