namespace InvoMir.Application.Features.Team;

internal static class TeamSeatPolicy
{
    public static async Task EnsureInvitationCapacityAsync(
        IAppDbContext context,
        Guid tenantId,
        DateTime utcNow,
        CancellationToken cancellationToken)
    {
        var plan = await GetTenantPlanAsync(context, tenantId, cancellationToken);
        var activeMemberCount = await CountActiveMembersAsync(context, tenantId, cancellationToken);
        var pendingInvitationCount = await context.TeamInvitations
            .IgnoreQueryFilters()
            .CountAsync(invitation =>
                invitation.TenantId == tenantId &&
                !invitation.IsDeleted &&
                invitation.Status == TeamConstants.InvitationStatuses.Pending &&
                invitation.ExpiresAt > utcNow,
                cancellationToken);

        EnsureCapacity(plan, activeMemberCount + pendingInvitationCount);
    }

    public static async Task EnsureAcceptanceCapacityAsync(
        IAppDbContext context,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var plan = await GetTenantPlanAsync(context, tenantId, cancellationToken);
        var activeMemberCount = await CountActiveMembersAsync(context, tenantId, cancellationToken);

        EnsureCapacity(plan, activeMemberCount);
    }

    private static async Task<string> GetTenantPlanAsync(
        IAppDbContext context,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var plan = await context.Tenants
            .IgnoreQueryFilters()
            .Where(tenant => tenant.Id == tenantId && !tenant.IsDeleted && tenant.IsActive)
            .Select(tenant => tenant.Plan)
            .FirstOrDefaultAsync(cancellationToken);

        return string.IsNullOrWhiteSpace(plan)
            ? throw new NotFoundException(nameof(Tenant), tenantId)
            : plan;
    }

    private static async Task<int> CountActiveMembersAsync(
        IAppDbContext context,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        return await context.Users
            .IgnoreQueryFilters()
            .CountAsync(user =>
                user.TenantId == tenantId &&
                user.IsActive &&
                !user.IsDeleted,
                cancellationToken);
    }

    private static void EnsureCapacity(string plan, int occupiedSeats)
    {
        if (plan != AuthConstants.Plans.Business)
            throw new ForbiddenException("Team seats require the Business plan.");

        if (occupiedSeats >= TeamConstants.BusinessSeatLimit)
            throw new ForbiddenException("Business plan team seat limit reached.");
    }
}
