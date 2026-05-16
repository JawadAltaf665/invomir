namespace InvoMir.Application.Features.Auth.Commands.ResetPassword;

public sealed class ResetPasswordCommandHandler(
    IAppDbContext context,
    IPasswordHasher passwordHasher,
    IAuthCookieService authCookieService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<ResetPasswordCommand, ApiResponse<string>>
{
    public async Task<ApiResponse<string>> Handle(
        ResetPasswordCommand request,
        CancellationToken cancellationToken)
    {
        var resetToken = await context.PasswordResetTokens
            .FirstOrDefaultAsync(token => token.Token == request.Token, cancellationToken);

        if (resetToken is null || !resetToken.IsValid)
            return ApiResponse<string>.Fail("Reset token is invalid or has expired.");

        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                currentUser => currentUser.Id == resetToken.UserId && currentUser.IsActive && !currentUser.IsDeleted,
                cancellationToken);

        if (user is null)
            return ApiResponse<string>.Fail("User not found.");

        user.UpdatePasswordHash(passwordHasher.HashPassword(request.NewPassword));
        resetToken.MarkUsed();

        var refreshTokens = await context.RefreshTokens
            .IgnoreQueryFilters()
            .Where(token => token.UserId == user.Id && !token.IsRevoked && !token.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var refreshToken in refreshTokens)
            refreshToken.Revoke();

        await context.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync(
            entityName: AuditConstants.Entities.User,
            entityId: user.Id,
            action: AuditConstants.Actions.PasswordReset,
            userId: user.Id,
            newValues: new
            {
                resetAt = DateTime.UtcNow,
                allSessionsRevoked = true,
                revokedSessionCount = refreshTokens.Count
            },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        authCookieService.ClearRefreshToken();

        return ApiResponse<string>.Ok("Password has been reset successfully. Please log in again.");
    }
}
