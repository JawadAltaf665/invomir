namespace InvoMir.Application.Features.Users.Commands.UpdateCurrentUser;

public sealed class UpdateCurrentUserCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<UpdateCurrentUserCommand, UserProfileDto>
{
    public async Task<UserProfileDto> Handle(
        UpdateCurrentUserCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var user = await context.Users
            .FirstOrDefaultAsync(currentUser => currentUser.Id == userId, cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(User), userId);

        var tenant = await context.Tenants
            .FirstOrDefaultAsync(currentTenant => currentTenant.Id == user.TenantId, cancellationToken);

        if (tenant is null)
            throw new NotFoundException(nameof(Tenant), user.TenantId);

        var oldValues = ToAuditSnapshot(user, tenant);

        if (request.BusinessName is not null)
            tenant.UpdateName(request.BusinessName);

        user.UpdateProfile(request.Currency, request.TaxPercent);

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            user.Id,
            AuditConstants.Actions.Updated,
            tenantContext.TenantId,
            userId,
            oldValues,
            ToAuditSnapshot(user, tenant),
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return ToDto(user, tenant);
    }

    private static UserProfileDto ToDto(User user, Tenant tenant)
    {
        return new UserProfileDto(
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            tenant.Name,
            user.LogoUrl,
            user.ProfilePictureUrl,
            user.Currency,
            user.PreferredLanguage,
            user.TaxPercent,
            user.Plan,
            user.Role,
            user.StripeAccountId,
            user.EmailVerified,
            user.LastLoginAt,
            user.TrialEndsAt ?? tenant.TrialEndsAt,
            user.CreationTime);
    }

    private static object ToAuditSnapshot(User user, Tenant tenant)
    {
        return new
        {
            user.Email,
            user.FirstName,
            user.LastName,
            BusinessName = tenant.Name,
            user.LogoUrl,
            user.ProfilePictureUrl,
            user.Currency,
            user.PreferredLanguage,
            user.TaxPercent,
            user.Plan,
            user.Role,
            user.StripeAccountId,
            user.EmailVerified,
            user.TrialEndsAt
        };
    }
}
