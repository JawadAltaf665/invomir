namespace InvoMir.Application.Features.Clients.DTOs;

public sealed record ClientDto(
    Guid Id,
    string Name,
    string Email,
    string? Phone,
    string? Address,
    string? Company,
    string? TaxId,
    string? Notes,
    bool IsActive,
    DateTime CreationTime);
