using InvoMir.Application.Features.Admin.DTOs;
using InvoMir.Application.Features.Team;

namespace InvoMir.Application.Features.Admin.Users.Commands.UpdateAdminUserPlan;

public sealed class UpdateAdminUserPlanCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<UpdateAdminUserPlanCommand, AdminUserPlanUpdateDto>
{
    public async Task<AdminUserPlanUpdateDto> Handle(
        UpdateAdminUserPlanCommand request,
        CancellationToken cancellationToken)
    {
        var adminUserId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentUser =>
                currentUser.Id == request.Id &&
                !currentUser.IsDeleted,
                cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(User), request.Id);

        var tenant = await context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentTenant =>
                currentTenant.Id == user.TenantId &&
                !currentTenant.IsDeleted,
                cancellationToken);

        if (tenant is null)
            throw new NotFoundException(nameof(Tenant), user.TenantId);

        var plan = request.Plan.Trim().ToLowerInvariant();
        var oldValues = ToAuditSnapshot(user, tenant);

        user.UpdatePlan(plan);
        tenant.UpdatePlan(plan);
        var cancelledInvitationCount = await TeamInvitationLifecycle.CancelPendingInvitationsForPlanAsync(
            context,
            tenant.Id,
            plan,
            DateTime.UtcNow,
            cancellationToken);

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            user.Id,
            AuditConstants.Actions.PlanOverridden,
            user.TenantId,
            adminUserId,
            oldValues,
            ToAuditSnapshot(user, tenant, cancelledInvitationCount),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return new AdminUserPlanUpdateDto(
            user.Id,
            user.TenantId,
            user.Plan,
            tenant.Plan);
    }

    private static object ToAuditSnapshot(User user, Tenant tenant)
    {
        return new
        {
            user.Id,
            user.Email,
            user.Plan,
            TenantPlan = tenant.Plan,
            user.TrialEndsAt,
            TenantTrialEndsAt = tenant.TrialEndsAt
        };
    }

    private static object ToAuditSnapshot(User user, Tenant tenant, int cancelledInvitationCount)
    {
        return new
        {
            user.Id,
            user.Email,
            user.Plan,
            TenantPlan = tenant.Plan,
            user.TrialEndsAt,
            TenantTrialEndsAt = tenant.TrialEndsAt,
            CancelledPendingTeamInvitations = cancelledInvitationCount
        };
    }
}
