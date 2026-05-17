namespace InvoMir.Application.Features.Clients.DTOs;

public sealed record ClientListItemDto(
    Guid Id,
    string Name,
    string Email,
    string? Company,
    decimal TotalRevenue,
    int InvoiceCount);
