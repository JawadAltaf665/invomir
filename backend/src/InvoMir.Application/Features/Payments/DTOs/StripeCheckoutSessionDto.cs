namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeCheckoutSessionDto(
    string Id,
    string Url);
