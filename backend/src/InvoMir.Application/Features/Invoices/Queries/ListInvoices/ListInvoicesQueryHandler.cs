namespace InvoMir.Application.Features.Invoices.Queries.ListInvoices;

public sealed class ListInvoicesQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    ICurrencyConversionService currencyConversionService)
    : IRequestHandler<ListInvoicesQuery, PagedResult<InvoiceListItemDto>>
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    public async Task<PagedResult<InvoiceListItemDto>> Handle(
        ListInvoicesQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");
        var tenantId = tenantContext.TenantId;
        var page = request.Page < DefaultPage ? DefaultPage : request.Page;
        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);
        var workspaceCurrency = await GetWorkspaceCurrencyAsync(userId, tenantId, cancellationToken);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var query = context.Invoices
            .AsNoTracking()
            .Where(invoice => invoice.TenantId == tenantId);

        query = ApplyStatusFilter(query, request.Status, today);

        if (request.ClientId.HasValue)
            query = query.Where(invoice => invoice.ClientId == request.ClientId.Value);

        if (request.From.HasValue)
            query = query.Where(invoice => invoice.IssueDate >= request.From.Value);

        if (request.To.HasValue)
            query = query.Where(invoice => invoice.IssueDate <= request.To.Value);

        var search = NormalizeOptional(request.Search);
        if (search is not null)
        {
            var normalizedSearch = search.ToLowerInvariant();
            query = query.Where(invoice =>
                invoice.InvoiceNumber.ToLower().Contains(normalizedSearch) ||
                invoice.Client.Name.ToLower().Contains(normalizedSearch) ||
                invoice.Client.Email.ToLower().Contains(normalizedSearch));
        }

        var invoiceRows = await query
            .Select(invoice => new InvoiceListSnapshot(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Client.Name,
                invoice.Status,
                invoice.Total,
                invoice.Currency,
                invoice.DueDate,
                invoice.SentAt,
                invoice.CreationTime))
            .ToListAsync(cancellationToken);

        var convertedRows = await ConvertInvoicesAsync(
            invoiceRows,
            workspaceCurrency,
            today,
            cancellationToken);

        var filteredRows = ApplyAmountFilters(convertedRows, request.MinAmount, request.MaxAmount);
        var sortedRows = ApplySorting(filteredRows, request.SortBy, request.SortDirection);
        var totalCount = sortedRows.Count;
        var items = sortedRows
            .Skip((page - 1) * limit)
            .Take(limit)
            .Select(invoice => new InvoiceListItemDto(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.ClientName,
                invoice.Status,
                invoice.Total,
                invoice.Currency,
                invoice.OriginalTotal,
                invoice.OriginalCurrency,
                invoice.ExchangeRate,
                invoice.RatesUpdatedAt,
                invoice.DueDate,
                invoice.SentAt))
            .ToList();

        return new PagedResult<InvoiceListItemDto>(items, page, limit, totalCount);
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

    private static IQueryable<Invoice> ApplyStatusFilter(
        IQueryable<Invoice> query,
        string? requestedStatus,
        DateOnly today)
    {
        var status = NormalizeOptional(requestedStatus)?.ToLowerInvariant();

        return status switch
        {
            null => query,
            InvoiceConstants.Statuses.Overdue => query.Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Overdue ||
                (invoice.DueDate < today &&
                    (invoice.Status == InvoiceConstants.Statuses.Sent ||
                     invoice.Status == InvoiceConstants.Statuses.Viewed))),
            InvoiceConstants.Statuses.Sent => query.Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Sent &&
                invoice.DueDate >= today),
            InvoiceConstants.Statuses.Viewed => query.Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Viewed &&
                invoice.DueDate >= today),
            _ => query.Where(invoice => invoice.Status == status)
        };
    }

    private async Task<List<ConvertedInvoiceListSnapshot>> ConvertInvoicesAsync(
        IReadOnlyList<InvoiceListSnapshot> invoices,
        string workspaceCurrency,
        DateOnly today,
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
            .Zip(conversions, (invoice, conversion) => new ConvertedInvoiceListSnapshot(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.ClientName,
                ResolveEffectiveStatus(invoice.Status, invoice.DueDate, today),
                RoundMoney(conversion.ConvertedAmount),
                conversion.TargetCurrency,
                conversion.OriginalAmount,
                conversion.OriginalCurrency,
                conversion.ExchangeRate,
                conversion.RatesUpdatedAt,
                invoice.DueDate,
                invoice.SentAt,
                invoice.CreationTime))
            .ToList();
    }

    private static List<ConvertedInvoiceListSnapshot> ApplyAmountFilters(
        IEnumerable<ConvertedInvoiceListSnapshot> invoices,
        decimal? minAmount,
        decimal? maxAmount)
    {
        var filtered = invoices;

        if (minAmount.HasValue)
            filtered = filtered.Where(invoice => invoice.Total >= minAmount.Value);

        if (maxAmount.HasValue)
            filtered = filtered.Where(invoice => invoice.Total <= maxAmount.Value);

        return filtered.ToList();
    }

    private static List<ConvertedInvoiceListSnapshot> ApplySorting(
        IReadOnlyList<ConvertedInvoiceListSnapshot> invoices,
        string? requestedSortBy,
        string? requestedDirection)
    {
        var sortBy = NormalizeOptional(requestedSortBy)?.ToLowerInvariant() ?? "created";
        var descending = !string.Equals(
            NormalizeOptional(requestedDirection),
            "asc",
            StringComparison.OrdinalIgnoreCase);

        IOrderedEnumerable<ConvertedInvoiceListSnapshot> ordered = sortBy switch
        {
            "invoice" => descending
                ? invoices.OrderByDescending(invoice => invoice.InvoiceNumber)
                : invoices.OrderBy(invoice => invoice.InvoiceNumber),
            "client" => descending
                ? invoices.OrderByDescending(invoice => invoice.ClientName)
                : invoices.OrderBy(invoice => invoice.ClientName),
            "status" => descending
                ? invoices.OrderByDescending(invoice => invoice.Status)
                : invoices.OrderBy(invoice => invoice.Status),
            "due" => descending
                ? invoices.OrderByDescending(invoice => invoice.DueDate)
                : invoices.OrderBy(invoice => invoice.DueDate),
            "sent" => descending
                ? invoices.OrderByDescending(invoice => invoice.SentAt ?? DateTime.MinValue)
                : invoices.OrderBy(invoice => invoice.SentAt ?? DateTime.MinValue),
            "total" => descending
                ? invoices.OrderByDescending(invoice => invoice.Total)
                : invoices.OrderBy(invoice => invoice.Total),
            _ => descending
                ? invoices.OrderByDescending(invoice => invoice.CreationTime)
                : invoices.OrderBy(invoice => invoice.CreationTime)
        };

        return ordered
            .ThenByDescending(invoice => invoice.CreationTime)
            .ToList();
    }

    private static string ResolveEffectiveStatus(string status, DateOnly dueDate, DateOnly today)
    {
        return dueDate < today &&
            (status == InvoiceConstants.Statuses.Sent ||
             status == InvoiceConstants.Statuses.Viewed)
                ? InvoiceConstants.Statuses.Overdue
                : status;
    }

    private static string NormalizeCurrency(string currency)
    {
        return string.IsNullOrWhiteSpace(currency)
            ? "USD"
            : currency.Trim().ToUpperInvariant();
    }

    private static string? NormalizeOptional(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static decimal RoundMoney(decimal amount)
    {
        return decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
    }

    private sealed record InvoiceListSnapshot(
        Guid Id,
        string InvoiceNumber,
        string ClientName,
        string Status,
        decimal Total,
        string Currency,
        DateOnly DueDate,
        DateTime? SentAt,
        DateTime CreationTime);

    private sealed record ConvertedInvoiceListSnapshot(
        Guid Id,
        string InvoiceNumber,
        string ClientName,
        string Status,
        decimal Total,
        string Currency,
        decimal OriginalTotal,
        string OriginalCurrency,
        decimal ExchangeRate,
        DateTimeOffset? RatesUpdatedAt,
        DateOnly DueDate,
        DateTime? SentAt,
        DateTime CreationTime);
}
