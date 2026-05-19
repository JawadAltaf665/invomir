using System.Security.Cryptography;
using System.Text.RegularExpressions;

namespace InvoMir.Application.Features.Auth.Commands.Register;

public sealed partial class RegisterCommandHandler(
    IAppDbContext context,
    ITokenService tokenService,
    IPasswordHasher passwordHasher,
    IAuthCookieService authCookieService,
    IEmailService emailService,
    IClientContext clientContext,
    IAuditService auditService)
    : IRequestHandler<RegisterCommand, ApiResponse<AuthTokenDto>>
{
    public async Task<ApiResponse<AuthTokenDto>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken)
    {
        var normalizedEmail = request.Email.ToLowerInvariant().Trim();
        var emailExists = await context.Users
            .IgnoreQueryFilters()
            .AsNoTracking()
            .AnyAsync(user => user.Email == normalizedEmail, cancellationToken);

        if (emailExists)
            return ApiResponse<AuthTokenDto>.Fail("Email is already registered.");

        var tenant = Tenant.Create(request.BusinessName, GenerateSlug(request.BusinessName));
        context.Tenants.Add(tenant);

        var passwordHash = passwordHasher.HashPassword(request.Password);
        var user = User.Create(
            tenant.Id,
            normalizedEmail,
            passwordHash,
            request.FirstName,
            request.LastName,
            request.Currency,
            request.TaxPercent);

        context.Users.Add(user);

        var verificationTokenValue = GenerateVerificationToken();
        var verificationToken = EmailVerificationToken.Create(user.Id, verificationTokenValue);
        context.EmailVerificationTokens.Add(verificationToken);

        var accessToken = tokenService.GenerateAccessToken(user, tenant.Id);
        var rawRefreshToken = tokenService.GenerateRefreshTokenString();
        var refreshToken = RefreshToken.Create(
            user.Id,
            tenant.Id,
            rawRefreshToken,
            deviceInfo: clientContext.DeviceInfo,
            ipAddress: clientContext.IpAddress);

        context.RefreshTokens.Add(refreshToken);

        await context.SaveChangesAsync(cancellationToken);
        await auditService.LogAsync(
            entityName: AuditConstants.Entities.User,
            entityId: user.Id,
            action: AuditConstants.Actions.Created,
            tenantId: tenant.Id,
            userId: user.Id,
            newValues: new
            {
                email = user.Email,
                firstName = user.FirstName,
                lastName = user.LastName,
                tenantId = tenant.Id,
                tenantName = tenant.Name,
                plan = user.Plan,
                role = user.Role
            },
            ipAddress: clientContext.IpAddress,
            userAgent: clientContext.DeviceInfo,
            cancellationToken: cancellationToken);

        authCookieService.SetRefreshToken(rawRefreshToken, refreshToken.ExpiresAt);
        await emailService.SendEmailVerificationAsync(user.Email, verificationTokenValue, cancellationToken);

        var tokenDto = new AuthTokenDto(
            accessToken.Token,
            rawRefreshToken,
            accessToken.ExpiresAt,
            user.Id,
            tenant.Id,
            user.Email,
            user.FirstName,
            user.TrialEndsAt,
            user.Plan,
            user.Role,
            accessToken.Permissions);
        return ApiResponse<AuthTokenDto>.Ok(tokenDto, "Account created successfully. Please verify your email.");
    }

    private static string GenerateSlug(string businessName)
    {
        var slug = businessName.ToLowerInvariant().Trim()
            .Replace(" ", "-", StringComparison.Ordinal)
            .Replace("'", string.Empty, StringComparison.Ordinal)
            .Replace(".", string.Empty, StringComparison.Ordinal);

        slug = SlugUnsafeCharacters().Replace(slug, string.Empty).Trim('-');
        if (string.IsNullOrWhiteSpace(slug))
            slug = "tenant";

        if (slug.Length > 93)
            slug = slug[..93].Trim('-');

        return $"{slug}-{Guid.NewGuid():N}"[..(slug.Length + 7)];
    }

    [GeneratedRegex("[^a-z0-9\\-]")]
    private static partial Regex SlugUnsafeCharacters();

    private static string GenerateVerificationToken()
    {
        return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-", StringComparison.Ordinal)
            .Replace("/", "_", StringComparison.Ordinal)
            .Replace("=", string.Empty, StringComparison.Ordinal);
    }
}
