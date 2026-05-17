namespace InvoMir.Application.Features.Clients.Commands.CreateClient;

public sealed record CreateClientCommand(
    string Name,
    string Email,
    string? Phone,
    string? Address,
    string? Company,
    string? TaxId,
    string? Notes) : IRequest<ClientDto>;
