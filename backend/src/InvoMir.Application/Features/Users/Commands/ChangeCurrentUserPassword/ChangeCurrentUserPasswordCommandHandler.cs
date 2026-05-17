namespace InvoMir.Application.Features.Users.Commands.ChangeCurrentUserPassword;

public sealed class ChangeCurrentUserPasswordCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IPasswordHasher passwordHasher,
    IAuthCookieService authCookieService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<ChangeCurrentUserPasswordCommand, ApiResponse<string>>
{
    public async Task<ApiResponse<string>> Handle(
        ChangeCurrentUserPasswordCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var user = await context.Users
            .FirstOrDefaultAsync(currentUser => currentUser.Id == userId, cancellationToken);

        if (user is null)
            throw new NotFoundException(nameof(User), userId);

        if (!passwordHasher.VerifyPassword(request.CurrentPassword, user.PasswordHash))
            return ApiResponse<string>.Fail("Current password is incorrect.");

        if (passwordHasher.VerifyPassword(request.NewPassword, user.PasswordHash))
            return ApiResponse<string>.Fail("New password must be different from current password.");

        user.UpdatePasswordHash(passwordHasher.HashPassword(request.NewPassword));

        var activeRefreshTokens = await context.RefreshTokens
            .IgnoreQueryFilters()
            .Where(token =>
                token.UserId == user.Id &&
                token.TenantId == tenantContext.TenantId &&
                !token.IsRevoked &&
                !token.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var refreshToken in activeRefreshTokens)
            refreshToken.Revoke();

        await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            user.Id,
            AuditConstants.Actions.PasswordChanged,
            tenantContext.TenantId,
            user.Id,
            newValues: new
            {
                changedAt = DateTime.UtcNow,
                allSessionsRevoked = true,
                revokedSessionCount = activeRefreshTokens.Count
            },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        authCookieService.ClearRefreshToken();

        return ApiResponse<string>.Ok("Password changed successfully. Please log in again.");
    }
}
