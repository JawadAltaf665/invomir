namespace InvoMir.Application.Features.Clients.DTOs;

public sealed record ClientDetailDto(
    Guid Id,
    string Name,
    string Email,
    string? Phone,
    string? Address,
    string? Company,
    string? TaxId,
    string? Notes,
    bool IsActive,
    decimal TotalRevenue,
    PagedResult<ClientInvoiceSummaryDto> Invoices);
