using InvoMir.Application.Features.Dashboard.DTOs;

namespace InvoMir.Application.Features.Dashboard.Queries.GetDashboard;

public sealed class GetDashboardQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    ICurrencyConversionService currencyConversionService)
    : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    private static readonly string[] OutstandingStatuses =
    [
        InvoiceConstants.Statuses.Sent,
        InvoiceConstants.Statuses.Viewed,
        InvoiceConstants.Statuses.Overdue
    ];

    public async Task<DashboardDto> Handle(
        GetDashboardQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");
        var tenantId = tenantContext.TenantId;

        var workspace = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId && user.TenantId == tenantId)
            .Select(user => new DashboardWorkspace(user.TenantId, user.Currency, user.Role))
            .FirstOrDefaultAsync(cancellationToken);

        if (workspace is null)
            throw new NotFoundException(nameof(User), userId);

        var workspaceCurrency = NormalizeCurrency(workspace.Currency);
        var workspaceRole = ResolveWorkspaceRole(workspace.Role);
        var utcNow = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(utcNow);
        var thisMonthStart = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonthStart = thisMonthStart.AddMonths(1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);

        var invoiceRows = await context.Invoices
            .AsNoTracking()
            .Where(invoice => invoice.TenantId == workspace.TenantId)
            .Select(invoice => new DashboardInvoiceSnapshot(
                invoice.Id,
                invoice.ClientId,
                invoice.Client.Name,
                invoice.InvoiceNumber,
                invoice.Status,
                invoice.Total,
                invoice.Currency,
                invoice.DueDate,
                invoice.SentAt,
                invoice.PaidAt,
                invoice.CreationTime))
            .ToListAsync(cancellationToken);

        var convertedInvoices = await ConvertInvoicesAsync(
            invoiceRows,
            workspaceCurrency,
            cancellationToken);

        var thisMonthRevenue = RoundMoney(convertedInvoices
            .Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Paid &&
                invoice.PaidAt is not null &&
                invoice.PaidAt >= thisMonthStart &&
                invoice.PaidAt < nextMonthStart)
            .Sum(invoice => invoice.Total));

        var lastMonthRevenue = RoundMoney(convertedInvoices
            .Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Paid &&
                invoice.PaidAt is not null &&
                invoice.PaidAt >= lastMonthStart &&
                invoice.PaidAt < thisMonthStart)
            .Sum(invoice => invoice.Total));

        var allTimeRevenue = RoundMoney(convertedInvoices
            .Where(invoice => invoice.Status == InvoiceConstants.Statuses.Paid)
            .Sum(invoice => invoice.Total));

        var outstanding = RoundMoney(convertedInvoices
            .Where(invoice => OutstandingStatuses.Contains(invoice.Status))
            .Sum(invoice => invoice.Total));

        var overdue = RoundMoney(convertedInvoices
            .Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Overdue ||
                (invoice.DueDate < today &&
                    (invoice.Status == InvoiceConstants.Statuses.Sent ||
                     invoice.Status == InvoiceConstants.Statuses.Viewed)))
            .Sum(invoice => invoice.Total));

        var counts = convertedInvoices
            .GroupBy(invoice => invoice.Status)
            .Select(group => new StatusCount(group.Key, group.Count()))
            .ToList();

        var recentInvoices = convertedInvoices
            .OrderByDescending(invoice => invoice.CreationTime)
            .Select(invoice => new DashboardRecentInvoiceDto(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.ClientName,
                invoice.Status,
                invoice.Total,
                workspaceCurrency,
                invoice.OriginalTotal,
                invoice.OriginalCurrency,
                invoice.ExchangeRate,
                invoice.DueDate,
                invoice.SentAt,
                invoice.PaidAt))
            .Take(10)
            .ToList();

        var topClients = convertedInvoices
            .GroupBy(invoice => new
            {
                invoice.ClientId,
                invoice.ClientName
            })
            .Select(group => new DashboardTopClientDto(
                group.Key.ClientId,
                group.Key.ClientName,
                RoundMoney(group
                    .Where(invoice => invoice.Status == InvoiceConstants.Statuses.Paid)
                    .Sum(invoice => invoice.Total)),
                RoundMoney(group.Sum(invoice => invoice.Total)),
                group.Count()))
            .OrderByDescending(client => client.Revenue)
            .ThenByDescending(client => client.InvoiceVolume)
            .Take(5)
            .ToList();

        return new DashboardDto(
            workspaceCurrency,
            workspaceRole,
            new DashboardRevenueDto(thisMonthRevenue, lastMonthRevenue, allTimeRevenue),
            outstanding,
            overdue,
            new DashboardInvoiceCountsDto(
                GetCount(counts, InvoiceConstants.Statuses.Draft),
                GetCount(counts, InvoiceConstants.Statuses.Sent),
                GetCount(counts, InvoiceConstants.Statuses.Viewed),
                GetCount(counts, InvoiceConstants.Statuses.Paid),
                GetCount(counts, InvoiceConstants.Statuses.Overdue),
                GetCount(counts, InvoiceConstants.Statuses.Cancelled)),
            recentInvoices,
            topClients);
    }

    private async Task<List<ConvertedDashboardInvoiceSnapshot>> ConvertInvoicesAsync(
        IReadOnlyList<DashboardInvoiceSnapshot> invoices,
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
            .Zip(conversions, (invoice, conversion) => new ConvertedDashboardInvoiceSnapshot(
                invoice.Id,
                invoice.ClientId,
                invoice.ClientName,
                invoice.InvoiceNumber,
                invoice.Status,
                conversion.ConvertedAmount,
                conversion.OriginalAmount,
                conversion.OriginalCurrency,
                conversion.ExchangeRate,
                invoice.DueDate,
                invoice.SentAt,
                invoice.PaidAt,
                invoice.CreationTime))
            .ToList();
    }

    private static int GetCount(IReadOnlyList<StatusCount> counts, string status)
    {
        return counts.FirstOrDefault(count => count.Status == status)?.Count ?? 0;
    }

    private static string NormalizeCurrency(string currency)
    {
        return string.IsNullOrWhiteSpace(currency)
            ? "USD"
            : currency.Trim().ToUpperInvariant();
    }

    private static string ResolveWorkspaceRole(string role)
    {
        return string.Equals(role, AuthConstants.Roles.SystemAdmin, StringComparison.OrdinalIgnoreCase)
            ? AuthConstants.Roles.Owner
            : role.Trim().ToLowerInvariant();
    }

    private static decimal RoundMoney(decimal amount)
    {
        return decimal.Round(amount, 2, MidpointRounding.AwayFromZero);
    }

    private sealed record DashboardWorkspace(
        Guid TenantId,
        string Currency,
        string Role);

    private sealed record DashboardInvoiceSnapshot(
        Guid Id,
        Guid ClientId,
        string ClientName,
        string InvoiceNumber,
        string Status,
        decimal Total,
        string Currency,
        DateOnly DueDate,
        DateTime? SentAt,
        DateTime? PaidAt,
        DateTime CreationTime);

    private sealed record ConvertedDashboardInvoiceSnapshot(
        Guid Id,
        Guid ClientId,
        string ClientName,
        string InvoiceNumber,
        string Status,
        decimal Total,
        decimal OriginalTotal,
        string OriginalCurrency,
        decimal ExchangeRate,
        DateOnly DueDate,
        DateTime? SentAt,
        DateTime? PaidAt,
        DateTime CreationTime);

    private sealed record StatusCount(string Status, int Count);
}
