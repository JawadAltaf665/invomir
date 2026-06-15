using InvoMir.Application.Features.Admin.DTOs;

namespace InvoMir.Application.Features.Admin.Users.Queries.ListAdminUsers;

public sealed class ListAdminUsersQueryHandler(IAppDbContext context)
    : IRequestHandler<ListAdminUsersQuery, PagedResult<AdminUserListItemDto>>
{
    private const int DefaultPage = 1;
    private const int DefaultLimit = 20;
    private const int MaxLimit = 100;

    public async Task<PagedResult<AdminUserListItemDto>> Handle(
        ListAdminUsersQuery request,
        CancellationToken cancellationToken)
    {
        var page = request.Page < DefaultPage ? DefaultPage : request.Page;
        var limit = request.Limit <= 0 ? DefaultLimit : Math.Min(request.Limit, MaxLimit);
        var utcNow = DateTime.UtcNow;
        var role = NormalizeFilter(request.Role, AuthConstants.Roles.All);
        var plan = NormalizeFilter(request.Plan, AuthConstants.Plans.All);

        var users =
            from user in context.Users.IgnoreQueryFilters().AsNoTracking()
            join tenant in context.Tenants.IgnoreQueryFilters().AsNoTracking()
                on user.TenantId equals tenant.Id
            where !user.IsDeleted && !tenant.IsDeleted
            select new { User = user, Tenant = tenant };

        if (!string.IsNullOrWhiteSpace(request.Q))
        {
            var search = request.Q.Trim().ToLowerInvariant();
            users = users.Where(row =>
                row.User.Email.ToLower().Contains(search) ||
                row.User.FirstName.ToLower().Contains(search) ||
                row.User.LastName.ToLower().Contains(search) ||
                row.Tenant.Name.ToLower().Contains(search));
        }

        if (role is not null)
            users = users.Where(row => row.User.Role == role);

        if (plan is not null)
            users = users.Where(row => row.User.Plan == plan);

        if (request.IsActive is not null)
            users = users.Where(row => row.User.IsActive == request.IsActive.Value);

        if (request.EmailVerified is not null)
            users = users.Where(row => row.User.EmailVerified == request.EmailVerified.Value);

        if (request.IsTrialActive is not null)
        {
            users = users.Where(row =>
                ((row.User.TrialEndsAt ?? row.Tenant.TrialEndsAt) > utcNow) ==
                request.IsTrialActive.Value);
        }

        if (request.HasStripeCustomer is not null)
        {
            users = users.Where(row =>
                (row.Tenant.StripeCustomerId != null && row.Tenant.StripeCustomerId != string.Empty) ==
                request.HasStripeCustomer.Value);
        }

        var totalCount = await users.CountAsync(cancellationToken);
        var items = await users
            .OrderByDescending(row => row.User.CreationTime)
            .Select(row => new AdminUserListItemDto(
                row.User.Id,
                row.User.TenantId,
                row.Tenant.Name,
                row.User.Email,
                row.User.FirstName,
                row.User.LastName,
                row.User.Role,
                row.User.Plan,
                (row.User.TrialEndsAt ?? row.Tenant.TrialEndsAt) > utcNow,
                row.User.TrialEndsAt ?? row.Tenant.TrialEndsAt,
                row.User.LastLoginAt,
                row.User.EmailVerified,
                row.User.IsActive,
                row.User.CreationTime,
                context.Invoices
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Count(invoice =>
                        invoice.UserId == row.User.Id &&
                        !invoice.IsDeleted),
                context.Invoices
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Count(invoice =>
                        invoice.UserId == row.User.Id &&
                        invoice.Status == InvoiceConstants.Statuses.Paid &&
                        !invoice.IsDeleted),
                context.Invoices
                    .IgnoreQueryFilters()
                    .AsNoTracking()
                    .Where(invoice =>
                        invoice.UserId == row.User.Id &&
                        invoice.Status == InvoiceConstants.Statuses.Paid &&
                        !invoice.IsDeleted)
                    .Sum(invoice => (decimal?)invoice.Total) ?? 0,
                row.Tenant.StripeCustomerId))
            .Skip((page - 1) * limit)
            .Take(limit)
            .ToListAsync(cancellationToken);

        return new PagedResult<AdminUserListItemDto>(items, page, limit, totalCount);
    }

    private static string? NormalizeFilter(string? value, IReadOnlyCollection<string> allowedValues)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var normalizedValue = value.Trim().ToLowerInvariant();
        return allowedValues.Contains(normalizedValue) ? normalizedValue : null;
    }
}
