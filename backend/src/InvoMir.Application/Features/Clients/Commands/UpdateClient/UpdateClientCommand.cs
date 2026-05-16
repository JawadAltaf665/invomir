namespace InvoMir.Application.Features.Clients.Commands.UpdateClient;

public sealed record UpdateClientCommand : IRequest<ClientDto>
{
    public Guid Id { get; init; }
    public string? Name { get; init; }
    public string? Email { get; init; }
    public string? Phone { get; init; }
    public string? Address { get; init; }
    public string? Company { get; init; }
    public string? TaxId { get; init; }
    public string? Notes { get; init; }
}
