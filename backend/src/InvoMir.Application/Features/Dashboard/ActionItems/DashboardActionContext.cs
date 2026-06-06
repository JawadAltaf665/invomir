namespace InvoMir.Application.Features.Dashboard.ActionItems;

public sealed record DashboardActionContext(
    Guid TenantId,
    Guid UserId,
    string Role,
    string Plan,
    bool EmailVerified,
    string? StripeAccountId,
    IReadOnlyCollection<string> Permissions);
