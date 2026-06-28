namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record StripeConnectStatusDto(
    bool IsConnected,
    string? AccountId,
    DateTime? ConnectedAt);
