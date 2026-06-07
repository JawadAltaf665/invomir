using InvoMir.Application.Features.Dashboard.DTOs;

namespace InvoMir.Application.Features.Dashboard.Queries.GetDashboardActionItems;

public sealed record GetDashboardActionItemsQuery : IRequest<DashboardActionItemsDto>;
