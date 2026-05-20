namespace InvoMir.Application.Features.Auth.Commands.Refresh;

public sealed class RefreshTokenCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IAuthCookieService authCookieService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<RefreshTokenCommand, ApiResponse<AuthTokenDto>>
{
    public async Task<ApiResponse<AuthTokenDto>> Handle(
        RefreshTokenCommand request,
        CancellationToken cancellationToken)
    {
        var rawToken = string.IsNullOrWhiteSpace(request.RefreshToken)
            ? authCookieService.GetRefreshToken()
            : request.RefreshToken.Trim();

        if (string.IsNullOrWhiteSpace(rawToken))
            return ApiResponse<AuthTokenDto>.Fail("No refresh token provided.");

        var refreshToken = await context.RefreshTokens
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(token => token.Token == rawToken && !token.IsDeleted, cancellationToken);

        if (refreshToken is null)
            return ApiResponse<AuthTokenDto>.Fail("Invalid refresh token.");

        if (!refreshToken.IsActive)
            return ApiResponse<AuthTokenDto>.Fail("Refresh token has expired or been revoked.");

        refreshToken.Revoke();

        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                currentUser => currentUser.Id == refreshToken.UserId && currentUser.IsActive && !currentUser.IsDeleted,
                cancellationToken);

        if (user is null)
            return ApiResponse<AuthTokenDto>.Fail("User not found or inactive.");

        var newAccessToken = tokenService.GenerateAccessToken(user, user.TenantId);
        var newRawRefreshToken = tokenService.GenerateRefreshTokenString();
        var newRefreshToken = RefreshToken.Create(
            user.Id,
            user.TenantId,
            newRawRefreshToken,
            deviceInfo: clientContext.DeviceInfo,
            ipAddress: clientContext.IpAddress);

        context.RefreshTokens.Add(newRefreshToken);

        await context.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync(
            entityName: AuditConstants.Entities.User,
            entityId: user.Id,
            action: AuditConstants.Actions.TokenRefreshed,
            tenantId: user.TenantId,
            userId: user.Id,
            newValues: new
            {
                refreshedAt = DateTime.UtcNow,
                ipAddress = clientContext.IpAddress
            },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        authCookieService.SetRefreshToken(newRawRefreshToken, newRefreshToken.ExpiresAt);

        var tokenDto = new AuthTokenDto(
            newAccessToken.Token,
            newRawRefreshToken,
            newAccessToken.ExpiresAt,
            user.Id,
            user.TenantId,
            user.Email,
            user.FirstName,
            user.TrialEndsAt,
            user.Plan,
            user.Role,
            newAccessToken.Permissions);
        return ApiResponse<AuthTokenDto>.Ok(tokenDto);
    }
}
