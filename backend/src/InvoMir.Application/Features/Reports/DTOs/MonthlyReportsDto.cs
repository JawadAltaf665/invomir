namespace InvoMir.Application.Features.Reports.DTOs;

public sealed record MonthlyReportsDto(
    IReadOnlyList<MonthlyReportMonthDto> Months);

public sealed record MonthlyReportMonthDto(
    string Month,
    decimal Paid,
    decimal Outstanding,
    decimal Overdue,
    int InvoiceCount);
