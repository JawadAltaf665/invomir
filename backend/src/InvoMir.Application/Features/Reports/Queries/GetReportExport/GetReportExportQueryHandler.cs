using System.Globalization;
using System.Net;
using System.Text;
using InvoMir.Application.Features.Reports.DTOs;

namespace InvoMir.Application.Features.Reports.Queries.GetReportExport;

public sealed class GetReportExportQueryHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    IPdfService pdfService)
    : IRequestHandler<GetReportExportQuery, ReportExportDto>
{
    private const string CsvContentType = "text/csv; charset=utf-8";
    private const string PdfContentType = "application/pdf";

    public async Task<ReportExportDto> Handle(
        GetReportExportQuery request,
        CancellationToken cancellationToken)
    {
        await EnsureCanExportAsync(cancellationToken);

        var format = NormalizeFormat(request.Format);
        var status = NormalizeStatus(request.Status);
        var rows = await QueryRowsAsync(request.From, request.To, status, cancellationToken);
        var fileName = BuildFileName(request.From, request.To, format);

        if (format == "pdf")
        {
            var html = BuildPdfHtml(request.From, request.To, status, rows);
            var pdfBytes = await pdfService.GeneratePdfAsync(html, cancellationToken);
            return new ReportExportDto(pdfBytes, fileName, PdfContentType);
        }

        return new ReportExportDto(BuildCsv(rows), fileName, CsvContentType);
    }

    private async Task EnsureCanExportAsync(CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var entitlement = await context.Users
            .AsNoTracking()
            .Where(user => user.Id == userId)
            .Select(user => new
            {
                user.Plan,
                user.TrialEndsAt
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (entitlement is null)
            throw new UnauthorizedAccessException("User context is not available.");

        var trialActive = entitlement.TrialEndsAt is not null && entitlement.TrialEndsAt > DateTime.UtcNow;
        if (entitlement.Plan == AuthConstants.Plans.Free && !trialActive)
            throw new ForbiddenException("Report export requires an active trial or paid plan.");
    }

    private async Task<List<ReportExportInvoiceDto>> QueryRowsAsync(
        DateOnly from,
        DateOnly to,
        string? status,
        CancellationToken cancellationToken)
    {
        var query = context.Invoices
            .AsNoTracking()
            .Where(invoice => invoice.IssueDate >= from && invoice.IssueDate <= to);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(invoice => invoice.Status == status);

        return await query
            .OrderBy(invoice => invoice.IssueDate)
            .ThenBy(invoice => invoice.InvoiceNumber)
            .Select(invoice => new ReportExportInvoiceDto(
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Client.Name,
                invoice.Status,
                invoice.IssueDate,
                invoice.DueDate,
                invoice.Currency,
                invoice.Subtotal,
                invoice.TaxAmount,
                invoice.Discount,
                invoice.Total,
                invoice.SentAt,
                invoice.PaidAt))
            .ToListAsync(cancellationToken);
    }

    private static byte[] BuildCsv(IReadOnlyList<ReportExportInvoiceDto> rows)
    {
        var builder = new StringBuilder();
        builder.AppendLine("Invoice Number,Client,Status,Issue Date,Due Date,Currency,Subtotal,Tax,Discount,Total,Sent At,Paid At");

        foreach (var row in rows)
        {
            builder
                .Append(Csv(row.InvoiceNumber)).Append(',')
                .Append(Csv(row.ClientName)).Append(',')
                .Append(Csv(row.Status)).Append(',')
                .Append(Csv(row.IssueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))).Append(',')
                .Append(Csv(row.DueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))).Append(',')
                .Append(Csv(row.Currency)).Append(',')
                .Append(FormatDecimal(row.Subtotal)).Append(',')
                .Append(FormatDecimal(row.TaxAmount)).Append(',')
                .Append(FormatDecimal(row.DiscountAmount)).Append(',')
                .Append(FormatDecimal(row.Total)).Append(',')
                .Append(Csv(FormatDateTime(row.SentAt))).Append(',')
                .Append(Csv(FormatDateTime(row.PaidAt)))
                .AppendLine();
        }

        return Encoding.UTF8.GetBytes(builder.ToString());
    }

    private static string BuildPdfHtml(
        DateOnly from,
        DateOnly to,
        string? status,
        IReadOnlyList<ReportExportInvoiceDto> rows)
    {
        var total = rows.Sum(row => row.Total);
        var paidTotal = rows
            .Where(row => row.Status == InvoiceConstants.Statuses.Paid)
            .Sum(row => row.Total);
        var outstandingTotal = rows
            .Where(row => row.Status is InvoiceConstants.Statuses.Sent
                or InvoiceConstants.Statuses.Viewed
                or InvoiceConstants.Statuses.Overdue)
            .Sum(row => row.Total);

        var tableRows = rows.Count == 0
            ? "<tr><td colspan=\"8\" class=\"empty\">No invoices found for this period.</td></tr>"
            : string.Concat(rows.Select(row => $"""
                <tr>
                  <td>{Html(row.InvoiceNumber)}</td>
                  <td>{Html(row.ClientName)}</td>
                  <td>{Html(row.Status)}</td>
                  <td>{Html(row.IssueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))}</td>
                  <td>{Html(row.DueDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))}</td>
                  <td>{Html(row.Currency)}</td>
                  <td class="numeric">{Html(FormatDecimal(row.Total))}</td>
                  <td>{Html(FormatDateTime(row.PaidAt))}</td>
                </tr>
                """));

        return $$"""
            <!doctype html>
            <html>
            <head>
              <meta charset="utf-8" />
              <style>
                body { font-family: Arial, sans-serif; color: #1f2937; margin: 28px; }
                h1 { font-size: 26px; margin: 0 0 8px; }
                .muted { color: #6b7280; font-size: 12px; }
                .summary { display: table; width: 100%; margin: 24px 0; border-collapse: collapse; }
                .summary div { display: table-cell; border: 1px solid #d1d5db; padding: 12px; }
                .label { color: #6b7280; font-size: 11px; text-transform: uppercase; }
                .value { font-size: 18px; font-weight: 700; margin-top: 4px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; }
                th { background: #f3f4f6; text-align: left; }
                th, td { border: 1px solid #d1d5db; padding: 8px; }
                .numeric { text-align: right; }
                .empty { text-align: center; color: #6b7280; }
              </style>
            </head>
            <body>
              <h1>InvoMir Report</h1>
              <div class="muted">
                Period: {{Html(from.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))}} to {{Html(to.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture))}}
                {{Html(string.IsNullOrWhiteSpace(status) ? string.Empty : $" | Status: {status}")}}
              </div>
              <div class="summary">
                <div><span class="label">Invoices</span><div class="value">{{rows.Count}}</div></div>
                <div><span class="label">Total</span><div class="value">{{Html(FormatDecimal(total))}}</div></div>
                <div><span class="label">Paid</span><div class="value">{{Html(FormatDecimal(paidTotal))}}</div></div>
                <div><span class="label">Outstanding</span><div class="value">{{Html(FormatDecimal(outstandingTotal))}}</div></div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Client</th>
                    <th>Status</th>
                    <th>Issue</th>
                    <th>Due</th>
                    <th>Currency</th>
                    <th class="numeric">Total</th>
                    <th>Paid At</th>
                  </tr>
                </thead>
                <tbody>{{tableRows}}</tbody>
              </table>
            </body>
            </html>
            """;
    }

    private static string NormalizeFormat(string? format)
    {
        return format?.Trim().ToLowerInvariant() ?? string.Empty;
    }

    private static string? NormalizeStatus(string? status)
    {
        return string.IsNullOrWhiteSpace(status)
            ? null
            : status.Trim().ToLowerInvariant();
    }

    private static string BuildFileName(DateOnly from, DateOnly to, string format)
    {
        return FormattableString.Invariant($"invomir-report-{from:yyyy-MM-dd}-{to:yyyy-MM-dd}.{format}");
    }

    private static string FormatDecimal(decimal value)
    {
        return value.ToString("0.00", CultureInfo.InvariantCulture);
    }

    private static string FormatDateTime(DateTime? value)
    {
        return value?.ToString("yyyy-MM-dd HH:mm 'UTC'", CultureInfo.InvariantCulture) ?? string.Empty;
    }

    private static string Csv(string value)
    {
        return value.Contains('"') || value.Contains(',') || value.Contains('\r') || value.Contains('\n')
            ? $"\"{value.Replace("\"", "\"\"", StringComparison.Ordinal)}\""
            : value;
    }

    private static string Html(string? value)
    {
        return WebUtility.HtmlEncode(value ?? string.Empty);
    }
}
