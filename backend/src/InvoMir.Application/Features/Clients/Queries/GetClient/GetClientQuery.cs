namespace InvoMir.Application.Features.Clients.Queries.GetClient;

public sealed record GetClientQuery(
    Guid Id,
    int Page = 1,
    int Limit = 20) : IRequest<ClientDetailDto>;
