using System.Globalization;
using InvoMir.Application.Features.Reports.DTOs;

namespace InvoMir.Application.Features.Reports.Queries.GetMonthlyReports;

public sealed class GetMonthlyReportsQueryHandler(IAppDbContext context)
    : IRequestHandler<GetMonthlyReportsQuery, MonthlyReportsDto>
{
    public async Task<MonthlyReportsDto> Handle(
        GetMonthlyReportsQuery request,
        CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var periods = BuildPeriods(request);
        var start = periods[0].Start;
        var end = periods[^1].Start.AddMonths(1);
        var paidStart = start.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var paidEnd = end.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        var issueRows = await context.Invoices
            .AsNoTracking()
            .Where(invoice => invoice.IssueDate >= start && invoice.IssueDate < end)
            .GroupBy(invoice => new { invoice.IssueDate.Year, invoice.IssueDate.Month })
            .Select(group => new MonthlyAccumulator(
                group.Key.Year,
                group.Key.Month,
                group.Sum(invoice =>
                    invoice.Status == InvoiceConstants.Statuses.Sent ||
                    invoice.Status == InvoiceConstants.Statuses.Viewed ||
                    invoice.Status == InvoiceConstants.Statuses.Overdue
                        ? invoice.Total
                        : 0),
                group.Sum(invoice =>
                    invoice.Status == InvoiceConstants.Statuses.Overdue ||
                    (invoice.DueDate < today &&
                        (invoice.Status == InvoiceConstants.Statuses.Sent ||
                         invoice.Status == InvoiceConstants.Statuses.Viewed))
                        ? invoice.Total
                        : 0),
                group.Count()))
            .ToListAsync(cancellationToken);

        var paidRows = await context.Invoices
            .AsNoTracking()
            .Where(invoice =>
                invoice.Status == InvoiceConstants.Statuses.Paid &&
                invoice.PaidAt != null &&
                invoice.PaidAt >= paidStart &&
                invoice.PaidAt < paidEnd)
            .GroupBy(invoice => new { invoice.PaidAt!.Value.Year, invoice.PaidAt.Value.Month })
            .Select(group => new PaidAccumulator(
                group.Key.Year,
                group.Key.Month,
                group.Sum(invoice => invoice.Total)))
            .ToListAsync(cancellationToken);

        var issueByMonth = issueRows.ToDictionary(row => ToMonthKey(row.Year, row.Month));
        var paidByMonth = paidRows.ToDictionary(row => ToMonthKey(row.Year, row.Month));
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

        return new MonthlyReportsDto(months);
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

    private static string ToMonthKey(int year, int month)
    {
        return FormattableString.Invariant($"{year:D4}-{month:D2}");
    }

    private sealed record ReportPeriod(DateOnly Start);

    private sealed record MonthlyAccumulator(
        int Year,
        int Month,
        decimal Outstanding,
        decimal Overdue,
        int InvoiceCount);

    private sealed record PaidAccumulator(
        int Year,
        int Month,
        decimal Paid);
}
