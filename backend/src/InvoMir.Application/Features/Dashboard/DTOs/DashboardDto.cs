using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Dashboard.DTOs;

public sealed record DashboardDto(
    [property: JsonPropertyName("revenue")] DashboardRevenueDto Revenue,
    [property: JsonPropertyName("outstanding")] decimal Outstanding,
    [property: JsonPropertyName("overdue")] decimal Overdue,
    [property: JsonPropertyName("invoice_counts")] DashboardInvoiceCountsDto InvoiceCounts,
    [property: JsonPropertyName("recent_invoices")] IReadOnlyList<DashboardRecentInvoiceDto> RecentInvoices,
    [property: JsonPropertyName("top_clients")] IReadOnlyList<DashboardTopClientDto> TopClients);

public sealed record DashboardRevenueDto(
    [property: JsonPropertyName("this_month")] decimal ThisMonth,
    [property: JsonPropertyName("last_month")] decimal LastMonth,
    [property: JsonPropertyName("all_time")] decimal AllTime);

public sealed record DashboardInvoiceCountsDto(
    [property: JsonPropertyName("draft")] int Draft,
    [property: JsonPropertyName("sent")] int Sent,
    [property: JsonPropertyName("viewed")] int Viewed,
    [property: JsonPropertyName("paid")] int Paid,
    [property: JsonPropertyName("overdue")] int Overdue,
    [property: JsonPropertyName("cancelled")] int Cancelled);

public sealed record DashboardRecentInvoiceDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("invoice_number")] string InvoiceNumber,
    [property: JsonPropertyName("client_name")] string ClientName,
    [property: JsonPropertyName("status")] string Status,
    [property: JsonPropertyName("total")] decimal Total,
    [property: JsonPropertyName("currency")] string Currency,
    [property: JsonPropertyName("due_date")] DateOnly DueDate,
    [property: JsonPropertyName("sent_at")] DateTime? SentAt,
    [property: JsonPropertyName("paid_at")] DateTime? PaidAt);

public sealed record DashboardTopClientDto(
    [property: JsonPropertyName("id")] Guid Id,
    [property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("revenue")] decimal Revenue);
