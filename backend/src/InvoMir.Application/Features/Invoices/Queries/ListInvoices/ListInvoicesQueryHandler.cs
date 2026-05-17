namespace InvoMir.Application.Features.Invoices.Queries.ListInvoices;

public sealed class ListInvoicesQueryHandler(IAppDbContext context)
    : IRequestHandler<ListInvoicesQuery, PagedResult<InvoiceListItemDto>>
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    public async Task<PagedResult<InvoiceListItemDto>> Handle(
        ListInvoicesQuery request,
        CancellationToken cancellationToken)
    {
        var page = request.Page < DefaultPage ? DefaultPage : request.Page;
        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);
        var query = context.Invoices.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = request.Status.Trim().ToLowerInvariant();
            query = query.Where(invoice => invoice.Status == status);
        }

        if (request.ClientId.HasValue)
            query = query.Where(invoice => invoice.ClientId == request.ClientId.Value);

        if (request.From.HasValue)
            query = query.Where(invoice => invoice.IssueDate >= request.From.Value);

        if (request.To.HasValue)
            query = query.Where(invoice => invoice.IssueDate <= request.To.Value);

        var totalCount = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(invoice => invoice.CreationTime)
            .Select(invoice => new InvoiceListItemDto(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Client.Name,
                invoice.Status,
                invoice.Total,
                invoice.Currency,
                invoice.DueDate,
                invoice.SentAt))
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return new PagedResult<InvoiceListItemDto>(items, page, limit, totalCount);
    }
}
