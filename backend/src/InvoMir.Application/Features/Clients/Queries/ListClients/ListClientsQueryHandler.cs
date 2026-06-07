namespace InvoMir.Application.Features.Clients.Queries.ListClients;

public sealed class ListClientsQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    ICurrencyConversionService currencyConversionService)
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
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");
        var tenantId = tenantContext.TenantId;
        var workspaceCurrency = await GetWorkspaceCurrencyAsync(userId, tenantId, cancellationToken);

        var query = context.Clients.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var search = request.Q.Trim().ToLowerInvariant();
            query = query.Where(client =>
                client.Name.ToLower().Contains(search) ||
                client.Email.ToLower().Contains(search) ||
                (client.Company != null && client.Company.ToLower().Contains(search)));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var clients = await query
            .OrderByDescending(client => client.CreationTime)
            .Select(client => new ClientSnapshot(
                client.Id,
                client.Name,
                client.Email,
                client.Company))
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        var clientIds = clients.Select(client => client.Id).ToArray();
        List<ClientInvoiceSummary> invoiceSummaries = clientIds.Length == 0
            ? []
            : await context.Invoices
                .AsNoTracking()
                .Where(invoice => clientIds.Contains(invoice.ClientId))
                .GroupBy(invoice => invoice.ClientId)
                .Select(group => new ClientInvoiceSummary(
                    group.Key,
                    group.Count(),
                    group.Count(invoice => invoice.Status == InvoiceConstants.Statuses.Draft),
                    group.Count(invoice => invoice.Status == InvoiceConstants.Statuses.Sent),
                    group.Count(invoice => invoice.Status == InvoiceConstants.Statuses.Viewed),
                    group.Count(invoice => invoice.Status == InvoiceConstants.Statuses.Paid),
                    group.Count(invoice => invoice.Status == InvoiceConstants.Statuses.Overdue),
                    group.Count(invoice => invoice.Status == InvoiceConstants.Statuses.Cancelled),
                    group.Max(invoice => (DateTime?)invoice.CreationTime)))
                .ToListAsync(cancellationToken);

        var summaryByClient = invoiceSummaries.ToDictionary(summary => summary.ClientId);
        List<ClientPaidInvoice> paidInvoices = clientIds.Length == 0
            ? []
            : await context.Invoices
                .AsNoTracking()
                .Where(invoice =>
                    clientIds.Contains(invoice.ClientId) &&
                    invoice.Status == InvoiceConstants.Statuses.Paid)
                .Select(invoice => new ClientPaidInvoice(invoice.ClientId, invoice.Total, invoice.Currency))
                .ToListAsync(cancellationToken);

        var paidRevenueByClient = await BuildPaidRevenueByClientAsync(
            paidInvoices,
            workspaceCurrency,
            cancellationToken);

        var items = clients
            .Select(client =>
            {
                summaryByClient.TryGetValue(client.Id, out var summary);

                return new ClientListItemDto(
                    client.Id,
                    client.Name,
                    client.Email,
                    client.Company,
                    paidRevenueByClient.GetValueOrDefault(client.Id),
                    workspaceCurrency,
                    summary?.InvoiceCount ?? 0,
                    summary?.DraftInvoiceCount ?? 0,
                    summary?.SentInvoiceCount ?? 0,
                    summary?.ViewedInvoiceCount ?? 0,
                    summary?.PaidInvoiceCount ?? 0,
                    summary?.OverdueInvoiceCount ?? 0,
                    summary?.CancelledInvoiceCount ?? 0,
                    summary?.LastInvoiceAt);
            })
            .ToList();

        return new PagedResult<ClientListItemDto>(items, page, limit, totalCount);
    }

    private async Task<string> GetWorkspaceCurrencyAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var currency = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId && user.TenantId == tenantId)
            .Select(user => user.Currency)
            .FirstOrDefaultAsync(cancellationToken);

        if (currency is null)
            throw new NotFoundException(nameof(User), userId);

        return NormalizeCurrency(currency);
    }

    private async Task<Dictionary<Guid, decimal>> BuildPaidRevenueByClientAsync(
        IReadOnlyList<ClientPaidInvoice> paidInvoices,
        string workspaceCurrency,
        CancellationToken cancellationToken)
    {
        if (paidInvoices.Count == 0)
            return [];

        var conversions = await currencyConversionService.ConvertAsync(
            paidInvoices
                .Select(invoice => new CurrencyAmount(invoice.Total, invoice.Currency))
                .ToList(),
            workspaceCurrency,
            cancellationToken);

        return paidInvoices
            .Zip(conversions, (invoice, conversion) => new
            {
                invoice.ClientId,
                Total = RoundMoney(conversion.ConvertedAmount)
            })
            .GroupBy(invoice => invoice.ClientId)
            .ToDictionary(
                group => group.Key,
                group => RoundMoney(group.Sum(invoice => invoice.Total)));
    }

    private static string NormalizeCurrency(string currency)
    {
        return string.IsNullOrWhiteSpace(currency)
            ? "USD"
            : currency.Trim().ToUpperInvariant();
    }

    private static decimal RoundMoney(decimal amount)
    {
        return decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
    }

    private sealed record ClientSnapshot(
        Guid Id,
        string Name,
        string Email,
        string? Company);

    private sealed record ClientInvoiceSummary(
        Guid ClientId,
        int InvoiceCount,
        int DraftInvoiceCount,
        int SentInvoiceCount,
        int ViewedInvoiceCount,
        int PaidInvoiceCount,
        int OverdueInvoiceCount,
        int CancelledInvoiceCount,
        DateTime? LastInvoiceAt);

    private sealed record ClientPaidInvoice(
        Guid ClientId,
        decimal Total,
        string Currency);
}
