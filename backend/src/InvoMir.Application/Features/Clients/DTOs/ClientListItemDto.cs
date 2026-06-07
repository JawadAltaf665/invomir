namespace InvoMir.Application.Features.Clients.DTOs;

public sealed record ClientListItemDto(
    Guid Id,
    string Name,
    string Email,
    string? Company,
    decimal TotalRevenue,
    string Currency,
    int InvoiceCount,
    int DraftInvoiceCount,
    int SentInvoiceCount,
    int ViewedInvoiceCount,
    int PaidInvoiceCount,
    int OverdueInvoiceCount,
    int CancelledInvoiceCount,
    DateTime? LastInvoiceAt);
