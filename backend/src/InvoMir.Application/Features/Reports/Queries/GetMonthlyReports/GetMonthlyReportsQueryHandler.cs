using InvoMir.Application.Features.Reports.DTOs;

namespace InvoMir.Application.Features.Reports.Queries.GetMonthlyReports;

public sealed class GetMonthlyReportsQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ICurrencyConversionService currencyConversionService)
    : IRequestHandler<GetMonthlyReportsQuery, MonthlyReportsDto>
{
    private static readonly string[] OutstandingStatuses =
    [
        InvoiceConstants.Statuses.Sent,
        InvoiceConstants.Statuses.Viewed,
        InvoiceConstants.Statuses.Overdue
    ];

    public async Task<MonthlyReportsDto> Handle(
        GetMonthlyReportsQuery request,
        CancellationToken cancellationToken)
    {
        var workspaceCurrency = await GetWorkspaceCurrencyAsync(cancellationToken);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var periods = BuildPeriods(request);
        var start = periods[0].Start;
        var end = periods[^1].Start.AddMonths(1);
        var paidStart = start.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var paidEnd = end.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var issueInvoices = await context.Invoices
            .AsNoTracking()
            .Where(invoice => invoice.IssueDate >= start && invoice.IssueDate < end)
            .Select(invoice => new ReportInvoiceSnapshot(
                invoice.Status,
                invoice.Total,
                invoice.Currency,
                invoice.IssueDate,
                invoice.DueDate,
                invoice.PaidAt))
            .ToListAsync(cancellationToken);

        var paidInvoices = await context.Invoices
            .AsNoTracking()
            .Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Paid &&
                invoice.PaidAt != null &&
                invoice.PaidAt >= paidStart &&
                invoice.PaidAt < paidEnd)
            .Select(invoice => new ReportInvoiceSnapshot(
                invoice.Status,
                invoice.Total,
                invoice.Currency,
                invoice.IssueDate,
                invoice.DueDate,
                invoice.PaidAt))
            .ToListAsync(cancellationToken);

        var convertedIssueInvoices = await ConvertInvoicesAsync(
            issueInvoices,
            workspaceCurrency,
            cancellationToken);
        var convertedPaidInvoices = await ConvertInvoicesAsync(
            paidInvoices,
            workspaceCurrency,
            cancellationToken);

        var issueByMonth = convertedIssueInvoices
            .GroupBy(invoice => ToMonthKey(invoice.IssueDate.Year, invoice.IssueDate.Month))
            .Select(group => new MonthlyAccumulator(
                group.Key,
                RoundMoney(group
                    .Where(invoice => OutstandingStatuses.Contains(invoice.Status))
                    .Sum(invoice => invoice.Total)),
                RoundMoney(group
                    .Where(invoice =>
                        invoice.Status == InvoiceConstants.Statuses.Overdue ||
                        (invoice.DueDate < today &&
                            (invoice.Status == InvoiceConstants.Statuses.Sent ||
                             invoice.Status == InvoiceConstants.Statuses.Viewed)))
                    .Sum(invoice => invoice.Total)),
                group.Count()))
            .ToDictionary(row => row.Month);

        var paidByMonth = convertedPaidInvoices
            .Where(invoice => invoice.PaidAt is not null)
            .GroupBy(invoice => ToMonthKey(invoice.PaidAt!.Value.Year, invoice.PaidAt.Value.Month))
            .Select(group => new PaidAccumulator(
                group.Key,
                RoundMoney(group.Sum(invoice => invoice.Total))))
            .ToDictionary(row => row.Month);

        var months = periods
            .Select(period =>
            {
                var key = ToMonthKey(period.Start.Year, period.Start.Month);
                issueByMonth.TryGetValue(key, out var issueRow);
                paidByMonth.TryGetValue(key, out var paidRow);

                return new MonthlyReportMonthDto(
                    key,
                    paidRow?.Paid ?? 0,
                    issueRow?.Outstanding ?? 0,
                    issueRow?.Overdue ?? 0,
                    issueRow?.InvoiceCount ?? 0);
            })
            .ToList();

        return new MonthlyReportsDto(workspaceCurrency, months);
    }

    private async Task<string> GetWorkspaceCurrencyAsync(CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var currency = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => user.Currency)
            .FirstOrDefaultAsync(cancellationToken);

        if (currency is null)
            throw new NotFoundException(nameof(User), userId);

        return NormalizeCurrency(currency);
    }

    private async Task<List<ConvertedReportInvoiceSnapshot>> ConvertInvoicesAsync(
        IReadOnlyList<ReportInvoiceSnapshot> invoices,
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
            .Zip(conversions, (invoice, conversion) => new ConvertedReportInvoiceSnapshot(
                invoice.Status,
                conversion.ConvertedAmount,
                invoice.IssueDate,
                invoice.DueDate,
                invoice.PaidAt))
            .ToList();
    }

    private static List<ReportPeriod> BuildPeriods(GetMonthlyReportsQuery request)
    {
        if (request.Year.HasValue && request.Month.HasValue)
            return [new ReportPeriod(new DateOnly(request.Year.Value, request.Month.Value, 1))];

        if (request.Year.HasValue)
        {
            return Enumerable.Range(1, 12)
                .Select(month => new ReportPeriod(new DateOnly(request.Year.Value, month, 1)))
                .ToList();
        }

        var utcNow = DateTime.UtcNow;
        var currentMonthStart = new DateOnly(utcNow.Year, utcNow.Month, 1);
        var start = currentMonthStart.AddMonths(-(request.Months - 1));

        return Enumerable.Range(0, request.Months)
            .Select(offset => new ReportPeriod(start.AddMonths(offset)))
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

    private static string ToMonthKey(int year, int month)
    {
        return FormattableString.Invariant($"{year:D4}-{month:D2}");
    }

    private sealed record ReportPeriod(DateOnly Start);

    private sealed record ReportInvoiceSnapshot(
        string Status,
        decimal Total,
        string Currency,
        DateOnly IssueDate,
        DateOnly DueDate,
        DateTime? PaidAt);

    private sealed record ConvertedReportInvoiceSnapshot(
        string Status,
        decimal Total,
        DateOnly IssueDate,
        DateOnly DueDate,
        DateTime? PaidAt);

    private sealed record MonthlyAccumulator(
        string Month,
        decimal Outstanding,
        decimal Overdue,
        int InvoiceCount);

    private sealed record PaidAccumulator(
        string Month,
        decimal Paid);
}
