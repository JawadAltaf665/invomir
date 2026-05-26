namespace InvoMir.Application.Features.Auth.Commands.Logout;

public sealed class LogoutCommandHandler(
    IAppDbContext context,
    ICurrentUserContext currentUserContext,
    ITenantContext tenantContext,
    IAuthCookieService authCookieService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<LogoutCommand, ApiResponse<string>>
{
    public async Task<ApiResponse<string>> Handle(
        LogoutCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUserContext.UserId
            ?? throw new UnauthorizedAccessException("User context is not available.");

        var rawRefreshToken = authCookieService.GetRefreshToken();

        if (!request.AllDevices && string.IsNullOrWhiteSpace(rawRefreshToken))
            return ApiResponse<string>.Fail("No refresh token provided.");

        var revokedCount = request.AllDevices
            ? await RevokeAllSessionsAsync(userId, tenantContext.TenantId, cancellationToken)
            : await RevokeCurrentSessionAsync(userId, rawRefreshToken, cancellationToken);

        if (revokedCount > 0)
            await context.SaveChangesAsync(cancellationToken);

        await auditService.LogAsync(
            AuditConstants.Entities.User,
            userId,
            AuditConstants.Actions.Logout,
            tenantContext.TenantId,
            userId,
            newValues: new
            {
                loggedOutAt = DateTime.UtcNow,
                allDevices = request.AllDevices,
                revokedSessionCount = revokedCount
            },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        authCookieService.ClearRefreshToken();

        return ApiResponse<string>.Ok("Logged out successfully.");
    }

    private async Task<int> RevokeAllSessionsAsync(
        Guid userId,
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        var refreshTokens = await context.RefreshTokens
            .IgnoreQueryFilters()
            .Where(token =>
                token.UserId == userId &&
                token.TenantId == tenantId &&
                !token.IsRevoked &&
                !token.IsDeleted)
            .ToListAsync(cancellationToken);

        foreach (var refreshToken in refreshTokens)
            refreshToken.Revoke();

        return refreshTokens.Count;
    }

    private async Task<int> RevokeCurrentSessionAsync(
        Guid userId,
        string? rawRefreshToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rawRefreshToken))
            return 0;

        var refreshToken = await context.RefreshTokens
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(token =>
                token.UserId == userId &&
                token.Token == rawRefreshToken &&
                !token.IsRevoked &&
                !token.IsDeleted,
                cancellationToken);

        if (refreshToken is null)
            return 0;

        refreshToken.Revoke();
        return 1;
    }
}
