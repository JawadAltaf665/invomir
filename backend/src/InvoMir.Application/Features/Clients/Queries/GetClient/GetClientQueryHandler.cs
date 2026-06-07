namespace InvoMir.Application.Features.Clients.Queries.GetClient;

public sealed class GetClientQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    ICurrencyConversionService currencyConversionService)
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
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");
        var workspaceCurrency = await GetWorkspaceCurrencyAsync(userId, tenantContext.TenantId, cancellationToken);

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

        var invoiceCount = await invoiceQuery.CountAsync(cancellationToken);
        var invoiceRows = await invoiceQuery
            .OrderByDescending(invoice => invoice.CreationTime)
            .Select(invoice => new ClientInvoiceSnapshot(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Status,
                invoice.Total,
                invoice.Currency,
                invoice.DueDate))
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);
        var invoices = await ConvertInvoicesAsync(invoiceRows, workspaceCurrency, cancellationToken);

        var paidInvoices = await invoiceQuery
            .Where(invoice => invoice.Status == InvoiceConstants.Statuses.Paid)
            .Select(invoice => new ClientInvoiceSnapshot(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Status,
                invoice.Total,
                invoice.Currency,
                invoice.DueDate))
            .ToListAsync(cancellationToken);
        var convertedPaidInvoices = await ConvertInvoicesAsync(
            paidInvoices,
            workspaceCurrency,
            cancellationToken);
        var totalRevenue = RoundMoney(convertedPaidInvoices.Sum(invoice => invoice.Total));

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
            workspaceCurrency,
            new PagedResult<ClientInvoiceSummaryDto>(invoices, page, limit, invoiceCount));
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

    private async Task<List<ClientInvoiceSummaryDto>> ConvertInvoicesAsync(
        IReadOnlyList<ClientInvoiceSnapshot> invoices,
        string workspaceCurrency,
        CancellationToken cancellationToken)
    {
        if (invoices.Count == 0)
            return [];

        var conversions = await currencyConversionService.ConvertAsync(
            invoices
                .Select(invoice => new CurrencyAmount(invoice.Total, invoice.Currency))
                .ToList(),
            workspaceCurrency,
            cancellationToken);

        return invoices
            .Zip(conversions, (invoice, conversion) => new ClientInvoiceSummaryDto(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Status,
                RoundMoney(conversion.ConvertedAmount),
                workspaceCurrency,
                invoice.DueDate))
            .ToList();
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

    private sealed record ClientInvoiceSnapshot(
        Guid Id,
        string InvoiceNumber,
        string Status,
        decimal Total,
        string Currency,
        DateOnly DueDate);
}
