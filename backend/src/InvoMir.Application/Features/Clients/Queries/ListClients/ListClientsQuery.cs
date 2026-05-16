namespace InvoMir.Application.Features.Clients.Queries.ListClients;

public sealed record ListClientsQuery(
    string? Q = null,
    int Page = 1,
    int Limit = 20) : IRequest<PagedResult<ClientListItemDto>>;
