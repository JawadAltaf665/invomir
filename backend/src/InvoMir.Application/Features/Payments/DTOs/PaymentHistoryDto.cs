namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record PaymentHistoryDto(
    IReadOnlyList<PaymentHistoryItemDto> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages);

public sealed record PaymentHistoryItemDto(
    Guid Id,
    Guid InvoiceId,
    string InvoiceNumber,
    Guid ClientId,
    string ClientName,
    decimal Amount,
    string Currency,
    string Method,
    string Status,
    DateTime PaidAt,
    string? StripeChargeId,
    string? StripePaymentIntentId,
    string? Note);
