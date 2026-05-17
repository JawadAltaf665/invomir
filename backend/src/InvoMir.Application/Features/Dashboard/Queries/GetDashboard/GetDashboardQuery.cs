using InvoMir.Application.Features.Dashboard.DTOs;

namespace InvoMir.Application.Features.Dashboard.Queries.GetDashboard;

public sealed record GetDashboardQuery : IRequest<DashboardDto>;
