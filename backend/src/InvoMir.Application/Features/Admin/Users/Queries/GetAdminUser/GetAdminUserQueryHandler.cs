using InvoMir.Application.Features.Admin.DTOs;

namespace InvoMir.Application.Features.Admin.Users.Queries.GetAdminUser;

public sealed class GetAdminUserQueryHandler(IAppDbContext context)
    : IRequestHandler<GetAdminUserQuery, AdminUserDetailDto>
{
    private const int MaxInvoices = 100;

    public async Task<AdminUserDetailDto> Handle(
        GetAdminUserQuery request,
        CancellationToken cancellationToken)
    {
        var profile = await (
                from user in context.Users.IgnoreQueryFilters().AsNoTracking()
                join tenant in context.Tenants.IgnoreQueryFilters().AsNoTracking()
                    on user.TenantId equals tenant.Id
                where user.Id == request.Id && !user.IsDeleted && !tenant.IsDeleted
                select new AdminUserProfileSnapshot(
                    user.Id,
                    user.TenantId,
                    tenant.Name,
                    user.Email,
                    user.FirstName,
                    user.LastName,
                    user.Role,
                    user.Plan,
                    user.TrialEndsAt ?? tenant.TrialEndsAt,
                    user.LastLoginAt,
                    user.EmailVerified,
                    user.IsActive,
                    user.CreationTime,
                    tenant.StripeCustomerId,
                    user.StripeAccountId))
            .FirstOrDefaultAsync(cancellationToken);

        if (profile is null)
            throw new NotFoundException(nameof(User), request.Id);

        var stats = await BuildStatsAsync(request.Id, cancellationToken);
        var invoices = await ListInvoicesAsync(request.Id, cancellationToken);
        var planHistory = await ListPlanHistoryAsync(profile, cancellationToken);

        return new AdminUserDetailDto(
            profile.Id,
            profile.TenantId,
            profile.TenantName,
            profile.Email,
            profile.FirstName,
            profile.LastName,
            profile.Role,
            profile.Plan,
            profile.TrialEndsAt > DateTime.UtcNow,
            profile.TrialEndsAt,
            profile.LastLoginAt,
            profile.EmailVerified,
            profile.IsActive,
            profile.CreatedAt,
            profile.StripeCustomerId,
            BuildStripeCustomerUrl(profile.StripeCustomerId),
            profile.StripeAccountId,
            stats,
            invoices,
            planHistory);
    }

    private async Task<AdminUserStatsDto> BuildStatsAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var utcToday = DateOnly.FromDateTime(DateTime.UtcNow);
        var invoices = context.Invoices
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(invoice =>
                invoice.UserId == userId &&
                !invoice.IsDeleted);

        var invoiceCount = await invoices.CountAsync(cancellationToken);
        var paidInvoiceCount = await invoices
            .CountAsync(invoice => invoice.Status == InvoiceConstants.Statuses.Paid, cancellationToken);
        var overdueInvoiceCount = await invoices
            .CountAsync(invoice =>
                invoice.Status != InvoiceConstants.Statuses.Paid &&
                invoice.Status != InvoiceConstants.Statuses.Cancelled &&
                invoice.DueDate < utcToday,
                cancellationToken);
        var totalRevenue = await invoices
            .Where(invoice => invoice.Status == InvoiceConstants.Statuses.Paid)
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken) ?? 0;
        var outstandingAmount = await invoices
            .Where(invoice =>
                invoice.Status != InvoiceConstants.Statuses.Paid &&
                invoice.Status != InvoiceConstants.Statuses.Cancelled)
            .SumAsync(invoice => (decimal?)invoice.Total, cancellationToken) ?? 0;

        return new AdminUserStatsDto(
            invoiceCount,
            paidInvoiceCount,
            overdueInvoiceCount,
            totalRevenue,
            outstandingAmount);
    }

    private async Task<IReadOnlyList<AdminUserInvoiceDto>> ListInvoicesAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        return await (
                from invoice in context.Invoices.IgnoreQueryFilters().AsNoTracking()
                join client in context.Clients.IgnoreQueryFilters().AsNoTracking()
                    on invoice.ClientId equals client.Id into clients
                from client in clients.DefaultIfEmpty()
                where invoice.UserId == userId && !invoice.IsDeleted
                orderby invoice.CreationTime descending
                select new AdminUserInvoiceDto(
                    invoice.Id,
                    invoice.InvoiceNumber,
                    client == null ? "Client" : client.Name,
                    invoice.Status,
                    invoice.Total,
                    invoice.Currency,
                    invoice.IssueDate,
                    invoice.DueDate,
                    invoice.SentAt,
                    invoice.PaidAt,
                    invoice.CreationTime))
            .Take(MaxInvoices)
            .ToListAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<AdminUserPlanHistoryDto>> ListPlanHistoryAsync(
        AdminUserProfileSnapshot profile,
        CancellationToken cancellationToken)
    {
        var planHistory = await context.Subscriptions
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(subscription =>
                subscription.UserId == profile.Id &&
                !subscription.IsDeleted)
            .OrderByDescending(subscription => subscription.CreationTime)
            .Select(subscription => new AdminUserPlanHistoryDto(
                "stripe",
                subscription.Plan,
                subscription.Status,
                subscription.Interval,
                subscription.Amount,
                subscription.Currency,
                subscription.CurrentPeriodStart,
                subscription.CurrentPeriodEnd,
                subscription.StripeSubscriptionId,
                subscription.CreationTime))
            .ToListAsync(cancellationToken);

        if (planHistory.Count > 0)
            return planHistory;

        return
        [
            new AdminUserPlanHistoryDto(
                "current",
                profile.Plan,
                "active",
                null,
                null,
                null,
                null,
                null,
                null,
                profile.CreatedAt)
        ];
    }

    private static string? BuildStripeCustomerUrl(string? stripeCustomerId)
    {
        return string.IsNullOrWhiteSpace(stripeCustomerId)
            ? null
            : $"https://dashboard.stripe.com/customers/{Uri.EscapeDataString(stripeCustomerId)}";
    }

    private sealed record AdminUserProfileSnapshot(
        Guid Id,
        Guid TenantId,
        string TenantName,
        string Email,
        string FirstName,
        string LastName,
        string Role,
        string Plan,
        DateTime? TrialEndsAt,
        DateTime? LastLoginAt,
        bool EmailVerified,
        bool IsActive,
        DateTime CreatedAt,
        string? StripeCustomerId,
        string? StripeAccountId);
}
