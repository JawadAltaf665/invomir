using InvoMir.Application.Features.Dashboard.DTOs;

namespace InvoMir.Application.Features.Dashboard.Queries.GetDashboard;

public sealed class GetDashboardQueryHandler(IAppDbContext context)
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
        var utcNow = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(utcNow);
        var thisMonthStart = new DateTime(utcNow.Year, utcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var nextMonthStart = thisMonthStart.AddMonths(1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);

        var invoices = context.Invoices.AsNoTracking();

        var thisMonthRevenue = await invoices
            .Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Paid &&
                invoice.PaidAt != null &&
                invoice.PaidAt >= thisMonthStart &&
                invoice.PaidAt < nextMonthStart)
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken) ?? 0;

        var lastMonthRevenue = await invoices
            .Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Paid &&
                invoice.PaidAt != null &&
                invoice.PaidAt >= lastMonthStart &&
                invoice.PaidAt < thisMonthStart)
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken) ?? 0;

        var allTimeRevenue = await invoices
            .Where(invoice => invoice.Status == InvoiceConstants.Statuses.Paid)
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken) ?? 0;

        var outstanding = await invoices
            .Where(invoice => OutstandingStatuses.Contains(invoice.Status))
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken) ?? 0;

        var overdue = await invoices
            .Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Overdue ||
                (invoice.DueDate < today &&
                    (invoice.Status == InvoiceConstants.Statuses.Sent ||
                     invoice.Status == InvoiceConstants.Statuses.Viewed)))
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken) ?? 0;

        var counts = await invoices
            .GroupBy(invoice => invoice.Status)
            .Select(group => new StatusCount(group.Key, group.Count()))
            .ToListAsync(cancellationToken);

        var recentInvoices = await invoices
            .OrderByDescending(invoice => invoice.CreationTime)
            .Select(invoice => new DashboardRecentInvoiceDto(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Client.Name,
                invoice.Status,
                invoice.Total,
                invoice.Currency,
                invoice.DueDate,
                invoice.SentAt,
                invoice.PaidAt))
            .Take(10)
            .ToListAsync(cancellationToken);

        var topClientRevenueRows = await invoices
            .Where(invoice => invoice.Status == InvoiceConstants.Statuses.Paid)
            .GroupBy(invoice => invoice.ClientId)
            .Select(group => new
            {
                ClientId = group.Key,
                Revenue = group.Sum(invoice => invoice.Total)
            })
            .OrderByDescending(client => client.Revenue)
            .Take(5)
            .ToListAsync(cancellationToken);

        var topClientRevenue = topClientRevenueRows
            .Select(client => new TopClientRevenue(client.ClientId, client.Revenue))
            .ToList();

        var topClients = await BuildTopClientsAsync(topClientRevenue, cancellationToken);

        return new DashboardDto(
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

    private async Task<List<DashboardTopClientDto>> BuildTopClientsAsync(
        IReadOnlyList<TopClientRevenue> topClientRevenue,
        CancellationToken cancellationToken)
    {
        if (topClientRevenue.Count == 0)
            return [];

        var clientIds = topClientRevenue.Select(client => client.ClientId).ToArray();
        var clientNames = await context.Clients
            .AsNoTracking()
            .Where(client => clientIds.Contains(client.Id))
            .Select(client => new
            {
                client.Id,
                client.Name
            })
            .ToDictionaryAsync(client => client.Id, client => client.Name, cancellationToken);

        return topClientRevenue
            .Select(client => new DashboardTopClientDto(
                client.ClientId,
                clientNames.GetValueOrDefault(client.ClientId, "Unknown Client"),
                client.Revenue))
            .ToList();
    }

    private static int GetCount(IReadOnlyList<StatusCount> counts, string status)
    {
        return counts.FirstOrDefault(count => count.Status == status)?.Count ?? 0;
    }

    private sealed record StatusCount(string Status, int Count);

    private sealed record TopClientRevenue(Guid ClientId, decimal Revenue);
}
