namespace InvoMir.Application.Features.Users.Commands.UploadCurrentUserProfilePicture;

public sealed class UploadCurrentUserProfilePictureCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IClientContext clientContext,
    IAuditService auditService,
    IUserProfilePictureStorageService profilePictureStorageService)
    : IRequestHandler<UploadCurrentUserProfilePictureCommand, UserProfilePictureDto>
{
    public async Task<UserProfilePictureDto> Handle(
        UploadCurrentUserProfilePictureCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var user = await context.Users
            .FirstOrDefaultAsync(currentUser => currentUser.Id == userId, cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(User), userId);

        var oldValues = new { user.ProfilePictureUrl };

        var profilePictureUrl = await profilePictureStorageService.SaveProfilePictureAsync(
            user.TenantId,
            user.Id,
            request.FileName,
            request.ContentType,
            request.Content,
            cancellationToken);

        user.UpdateProfilePictureUrl(profilePictureUrl);

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            user.Id,
            AuditConstants.Actions.Updated,
            tenantContext.TenantId,
            userId,
            oldValues,
            new { user.ProfilePictureUrl },
            clientContext.IpAddress,
            clientContext.DeviceInfo,
            cancellationToken);

        return new UserProfilePictureDto(user.ProfilePictureUrl!);
    }
}
