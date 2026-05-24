namespace InvoMir.Application.Features.Dashboard.DTOs;

public sealed record DashboardDto(
    string Currency,
    string WorkspaceRole,
    DashboardRevenueDto Revenue,
    decimal Outstanding,
    decimal Overdue,
    DashboardInvoiceCountsDto InvoiceCounts,
    IReadOnlyList<DashboardRecentInvoiceDto> RecentInvoices,
    IReadOnlyList<DashboardTopClientDto> TopClients);

public sealed record DashboardRevenueDto(
    decimal ThisMonth,
    decimal LastMonth,
    decimal AllTime);

public sealed record DashboardInvoiceCountsDto(
    int Draft,
    int Sent,
    int Viewed,
    int Paid,
    int Overdue,
    int Cancelled);

public sealed record DashboardRecentInvoiceDto(
    Guid Id,
    string InvoiceNumber,
    string ClientName,
    string Status,
    decimal Total,
    string Currency,
    decimal OriginalTotal,
    string OriginalCurrency,
    decimal ExchangeRate,
    DateOnly DueDate,
    DateTime? SentAt,
    DateTime? PaidAt);

public sealed record DashboardTopClientDto(
    Guid Id,
    string Name,
    decimal Revenue,
    decimal InvoiceVolume,
    int InvoiceCount);
