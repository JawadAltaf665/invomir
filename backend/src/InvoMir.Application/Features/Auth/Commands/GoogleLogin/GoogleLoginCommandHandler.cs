using System.Security.Cryptography;
using InvoMir.Application.Features.Auth.Common;

namespace InvoMir.Application.Features.Auth.Commands.GoogleLogin;

public sealed class GoogleLoginCommandHandler(
    IAppDbContext context,
    IGoogleAuthService googleAuthService,
    ITokenService tokenService,
    IPasswordHasher passwordHasher,
    IAuthCookieService authCookieService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<GoogleLoginCommand, ApiResponse<AuthTokenDto>>
{
    public async Task<ApiResponse<AuthTokenDto>> Handle(
        GoogleLoginCommand request,
        CancellationToken cancellationToken)
    {
        if (!googleAuthService.IsConfigured)
            return ApiResponse<AuthTokenDto>.Fail("Google sign-in is not configured.");

        var googleProfile = await googleAuthService.VerifyIdTokenAsync(request.IdToken, cancellationToken);
        if (googleProfile is null)
            return ApiResponse<AuthTokenDto>.Fail("Google sign-in could not be verified.");

        var normalizedEmail = googleProfile.Email.ToLowerInvariant().Trim();
        var user = await context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentUser => currentUser.Email == normalizedEmail, cancellationToken);

        if (user is { IsDeleted: true } or { IsActive: false })
            return ApiResponse<AuthTokenDto>.Fail("This account cannot sign in with Google.");

        var createdNewAccount = false;
        if (user is null)
        {
            var tenantName = BuildTenantName(googleProfile);
            var tenant = Tenant.Create(tenantName, AuthAccountHelper.GenerateSlug(tenantName));
            context.Tenants.Add(tenant);

            user = User.Create(
                tenant.Id,
                normalizedEmail,
                passwordHasher.HashPassword(GenerateExternalPasswordSeed()),
                ResolveFirstName(googleProfile),
                ResolveLastName(googleProfile));
            user.VerifyEmail();

            if (!string.IsNullOrWhiteSpace(googleProfile.PictureUrl))
                user.UpdateProfilePictureUrl(googleProfile.PictureUrl);

            context.Users.Add(user);
            createdNewAccount = true;
        }
        else
        {
            if (!user.EmailVerified)
                user.VerifyEmail();

            if (string.IsNullOrWhiteSpace(user.ProfilePictureUrl) &&
                !string.IsNullOrWhiteSpace(googleProfile.PictureUrl))
            {
                user.UpdateProfilePictureUrl(googleProfile.PictureUrl);
            }
        }

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
            action: createdNewAccount ? AuditConstants.Actions.Created : AuditConstants.Actions.Login,
            tenantId: user.TenantId,
            userId: user.Id,
            newValues: new
            {
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                tenantId = user.TenantId,
                plan = user.Plan,
                role = user.Role,
                provider = "google",
                loginAt = user.LastLoginAt
            },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        authCookieService.SetRefreshToken(rawRefreshToken, refreshToken.ExpiresAt);

        var tokenDto = new AuthTokenDto(
            accessToken.Token,
            accessToken.ExpiresAt,
            user.Id,
            user.TenantId,
            user.Email,
            user.FirstName,
            user.TrialEndsAt,
            user.Plan,
            user.Role,
            accessToken.Permissions);

        return ApiResponse<AuthTokenDto>.Ok(
            tokenDto,
            createdNewAccount ? "Account created successfully with Google." : null);
    }

    private static string BuildTenantName(GoogleUserProfileDto profile)
    {
        var name = !string.IsNullOrWhiteSpace(profile.Name)
            ? profile.Name.Trim()
            : profile.Email.Split('@', StringSplitOptions.RemoveEmptyEntries)[0];

        return $"{name}'s Workspace";
    }

    private static string ResolveFirstName(GoogleUserProfileDto profile)
    {
        if (!string.IsNullOrWhiteSpace(profile.GivenName))
            return profile.GivenName.Trim();

        var nameParts = profile.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        return nameParts.FirstOrDefault() ?? profile.Email.Split('@', StringSplitOptions.RemoveEmptyEntries)[0];
    }

    private static string ResolveLastName(GoogleUserProfileDto profile)
    {
        if (!string.IsNullOrWhiteSpace(profile.FamilyName))
            return profile.FamilyName.Trim();

        var nameParts = profile.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (nameParts.Length > 1)
            return string.Join(' ', nameParts.Skip(1));

        return "User";
    }

    private static string GenerateExternalPasswordSeed()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
    }
}
