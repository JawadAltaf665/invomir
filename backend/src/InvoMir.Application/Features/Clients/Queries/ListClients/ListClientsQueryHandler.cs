namespace InvoMir.Application.Features.Clients.Queries.ListClients;

public sealed class ListClientsQueryHandler(IAppDbContext context)
    : IRequestHandler<ListClientsQuery, PagedResult<ClientListItemDto>>
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    public async Task<PagedResult<ClientListItemDto>> Handle(
        ListClientsQuery request,
        CancellationToken cancellationToken)
    {
        var page = request.Page < DefaultPage ? DefaultPage : request.Page;
        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);

        var query = context.Clients.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var search = request.Q.Trim().ToLowerInvariant();
            query = query.Where(client =>
                client.Name.ToLower().Contains(search) ||
                client.Email.ToLower().Contains(search));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(client => client.CreationTime)
            .Select(client => new ClientListItemDto(
                client.Id,
                client.Name,
                client.Email,
                client.Company,
                context.Invoices
                    .AsNoTracking()
                    .Where(invoice =>
                        invoice.ClientId == client.Id &&
                        invoice.Status == InvoiceConstants.Statuses.Paid)
                    .Sum(invoice => (decimal?)invoice.Total) ?? 0,
                context.Invoices
                    .AsNoTracking()
                    .Count(invoice => invoice.ClientId == client.Id)))
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return new PagedResult<ClientListItemDto>(items, page, limit, totalCount);
    }
}
