namespace InvoMir.Application.Features.Users.Commands.UploadCurrentUserLogo;

public sealed class UploadCurrentUserLogoCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService,
    IUserLogoStorageService userLogoStorageService)
    : IRequestHandler<UploadCurrentUserLogoCommand, UserLogoDto>
{
    public async Task<UserLogoDto> Handle(
        UploadCurrentUserLogoCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var user = await context.Users
            .FirstOrDefaultAsync(currentUser => currentUser.Id == userId, cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(User), userId);

        var oldValues = new { user.LogoUrl };

        var logoUrl = await userLogoStorageService.SaveLogoAsync(
            user.TenantId,
            user.Id,
            request.FileName,
            request.ContentType,
            request.Content,
            cancellationToken);

        user.UpdateLogoUrl(logoUrl);

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            user.Id,
            AuditConstants.Actions.Updated,
            tenantContext.TenantId,
            userId,
            oldValues,
            new { user.LogoUrl },
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return new UserLogoDto(user.LogoUrl!);
    }
}
