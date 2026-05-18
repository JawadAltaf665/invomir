using InvoMir.Application.Features.Admin.DTOs;

namespace InvoMir.Application.Features.Admin.Users.Commands.UpdateAdminUserTrial;

public sealed class UpdateAdminUserTrialCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<UpdateAdminUserTrialCommand, AdminUserTrialUpdateDto>
{
    public async Task<AdminUserTrialUpdateDto> Handle(
        UpdateAdminUserTrialCommand request,
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

        var trialEndsAtUtc = NormalizeUtc(request.TrialEndsAt);
        var oldValues = ToAuditSnapshot(user, tenant);

        user.UpdateTrialEndsAt(trialEndsAtUtc);
        tenant.UpdateTrialEndsAt(trialEndsAtUtc);

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            user.Id,
            AuditConstants.Actions.TrialExtended,
            user.TenantId,
            adminUserId,
            oldValues,
            ToAuditSnapshot(user, tenant),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return new AdminUserTrialUpdateDto(
            user.Id,
            user.TenantId,
            user.TrialEndsAt ?? trialEndsAtUtc,
            tenant.TrialEndsAt,
            (user.TrialEndsAt ?? tenant.TrialEndsAt) > DateTime.UtcNow);
    }

    private static DateTime NormalizeUtc(DateTime value)
    {
        return value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
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
}
