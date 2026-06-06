using InvoMir.Application.Features.Dashboard.DTOs;

namespace InvoMir.Application.Features.Dashboard.ActionItems;

public interface IDashboardActionItemProvider
{
    Task<IReadOnlyList<DashboardActionItemDto>> GetItemsAsync(
        DashboardActionContext context,
        CancellationToken cancellationToken);
}
