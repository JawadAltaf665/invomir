namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeConnectOAuthRequestDto(
    Guid UserId,
    Guid TenantId,
    string State);
