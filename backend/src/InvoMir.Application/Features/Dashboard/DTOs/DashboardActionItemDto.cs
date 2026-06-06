namespace InvoMir.Application.Features.Dashboard.DTOs;

public sealed record DashboardActionItemsDto(
    IReadOnlyList<DashboardActionItemDto> Items);

public sealed record DashboardActionItemDto(
    string Id,
    string Type,
    string Title,
    string Message,
    string? ActionLabel,
    string? ActionUrl,
    bool Dismissible,
    int Priority);
