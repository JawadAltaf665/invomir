using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Payments.DTOs;

public sealed record PaymentHistoryDto(
    [property: JsonPropertyName("items")] IReadOnlyList<PaymentHistoryItemDto> Items,
    [property: JsonPropertyName("page")] int Page,
    [property: JsonPropertyName("pageSize")] int PageSize,
    [property: JsonPropertyName("totalCount")] int TotalCount,
    [property: JsonPropertyName("totalPages")] int TotalPages);

public sealed record PaymentHistoryItemDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("invoiceId")] Guid InvoiceId,
    [property: JsonPropertyName("invoiceNumber")] string InvoiceNumber,
    [property: JsonPropertyName("clientId")] Guid ClientId,
    [property: JsonPropertyName("clientName")] string ClientName,
    [property: JsonPropertyName("amount")] decimal Amount,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("method")] string Method,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("paidAt")] DateTime PaidAt,
    [property: JsonPropertyName("stripeChargeId")] string? StripeChargeId,
    [property: JsonPropertyName("stripePaymentIntentId")] string? StripePaymentIntentId,
    [property: JsonPropertyName("note")] string? Note);
