using InvoMir.Application.Features.Reports.DTOs;

namespace InvoMir.Application.Features.Reports.Queries.GetReportExport;

public sealed record GetReportExportQuery(
    string? Format,
    DateOnly From,
    DateOnly To,
    string? Status) : IRequest<ReportExportDto>;
