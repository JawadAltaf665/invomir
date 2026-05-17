using System.Text.Json.Serialization;

namespace InvoMir.Application.Features.Reports.DTOs;

public sealed record MonthlyReportsDto(
    [property: JsonPropertyName("months")] IReadOnlyList<MonthlyReportMonthDto> Months);

public sealed record MonthlyReportMonthDto(
    [property: JsonPropertyName("month")] string Month,
    [property: JsonPropertyName("paid")] decimal Paid,
    [property: JsonPropertyName("outstanding")] decimal Outstanding,
    [property: JsonPropertyName("overdue")] decimal Overdue,
    [property: JsonPropertyName("invoice_count")] int InvoiceCount);
