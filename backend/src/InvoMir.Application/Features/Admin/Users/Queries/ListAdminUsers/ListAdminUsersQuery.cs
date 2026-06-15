using InvoMir.Application.Features.Admin.DTOs;

namespace InvoMir.Application.Features.Admin.Users.Queries.ListAdminUsers;

public sealed record ListAdminUsersQuery(
    string? Q = null,
    string? Role = null,
    string? Plan = null,
    bool? IsActive = null,
    bool? EmailVerified = null,
    bool? IsTrialActive = null,
    bool? HasStripeCustomer = null,
    int Page = 1,
    int Limit = 20) : IRequest<PagedResult<AdminUserListItemDto>>;
