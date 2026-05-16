namespace InvoMir.Application.Features.Clients.Queries.GetClient;

public sealed class GetClientQueryHandler(IAppDbContext context)
    : IRequestHandler<GetClientQuery, ClientDetailDto>
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    public async Task<ClientDetailDto> Handle(
        GetClientQuery request,
        CancellationToken cancellationToken)
    {
        var page = request.Page < DefaultPage ? DefaultPage : request.Page;
        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);

        var client = await context.Clients
            .AsNoTracking()
            .Where(currentClient => currentClient.Id == request.Id)
            .Select(currentClient => new
            {
                currentClient.Id,
                currentClient.Name,
                currentClient.Email,
                currentClient.Phone,
                currentClient.Address,
                currentClient.Company,
                currentClient.TaxId,
                currentClient.Notes,
                currentClient.IsActive
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (client is null)
            throw new NotFoundException(nameof(Client), request.Id);

        var invoiceQuery = context.Invoices
            .AsNoTracking()
            .Where(invoice => invoice.ClientId == request.Id);

        var totalRevenue = await invoiceQuery
            .Where(invoice => invoice.Status == InvoiceConstants.Statuses.Paid)
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken) ?? 0;

        var invoiceCount = await invoiceQuery.CountAsync(cancellationToken);
        var invoices = await invoiceQuery
            .OrderByDescending(invoice => invoice.CreationTime)
            .Select(invoice => new ClientInvoiceSummaryDto(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Status,
                invoice.Total,
                invoice.Currency,
                invoice.DueDate))
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return new ClientDetailDto(
            client.Id,
            client.Name,
            client.Email,
            client.Phone,
            client.Address,
            client.Company,
            client.TaxId,
            client.Notes,
            client.IsActive,
            totalRevenue,
            new PagedResult<ClientInvoiceSummaryDto>(invoices, page, limit, invoiceCount));
    }
}
