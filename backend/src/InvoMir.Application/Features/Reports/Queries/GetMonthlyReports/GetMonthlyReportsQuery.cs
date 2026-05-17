using InvoMir.Application.Features.Reports.DTOs;

namespace InvoMir.Application.Features.Reports.Queries.GetMonthlyReports;

public sealed record GetMonthlyReportsQuery(
    int Months = 12,
    int? Year = null,
    int? Month = null) : IRequest<MonthlyReportsDto>;
