namespace InvoMir.Application.Features.Auth.Commands.Login;

public sealed class LoginCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IPasswordHasher passwordHasher,
    IAuthCookieService authCookieService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<LoginCommand, ApiResponse<AuthTokenDto>>
{
    private const string InvalidCredentialsMessage = "Invalid email or password.";

    public async Task<ApiResponse<AuthTokenDto>> Handle(
        LoginCommand request,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.ToLowerInvariant().Trim();
        var userSnapshot = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(user => user.Email == normalizedEmail && user.IsActive && !user.IsDeleted)
            .Select(user => new
            {
                user.Id,
                user.TenantId,
                user.Email,
                user.PasswordHash,
                user.FirstName
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (userSnapshot is null)
            return ApiResponse<AuthTokenDto>.Fail(InvalidCredentialsMessage);

        if (!passwordHasher.VerifyPassword(request.Password, userSnapshot.PasswordHash))
            return ApiResponse<AuthTokenDto>.Fail(InvalidCredentialsMessage);

        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstAsync(currentUser => currentUser.Id == userSnapshot.Id && !currentUser.IsDeleted, cancellationToken);

        user.RecordLogin();

        var accessToken = tokenService.GenerateAccessToken(user, user.TenantId);
        var rawRefreshToken = tokenService.GenerateRefreshTokenString();
        var refreshToken = RefreshToken.Create(
            user.Id,
            user.TenantId,
            rawRefreshToken,
            deviceInfo: clientContext.DeviceInfo,
            ipAddress: clientContext.IpAddress);

        context.RefreshTokens.Add(refreshToken);

        await context.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync(
            entityName: AuditConstants.Entities.User,
            entityId: user.Id,
            action: AuditConstants.Actions.Login,
            tenantId: user.TenantId,
            userId: user.Id,
            newValues: new
            {
                loginAt = user.LastLoginAt,
                ipAddress = clientContext.IpAddress
            },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        authCookieService.SetRefreshToken(rawRefreshToken, refreshToken.ExpiresAt);

        var tokenDto = new AuthTokenDto(
            accessToken.Token,
            rawRefreshToken,
            accessToken.ExpiresAt,
            user.Id,
            user.TenantId,
            user.Email,
            user.FirstName,
            user.TrialEndsAt,
            user.Plan);
        return ApiResponse<AuthTokenDto>.Ok(tokenDto);
    }
}
