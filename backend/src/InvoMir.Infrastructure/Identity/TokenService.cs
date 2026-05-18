using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

namespace InvoMir.Infrastructure.Identity;

public sealed class TokenService(IOptions<JwtSettings> jwtSettings) : ITokenService
{
    private readonly JwtSettings _settings = jwtSettings.Value;

    public (string Token, DateTime ExpiresAt) GenerateAccessToken(User user, Guid tenantId)
    {
        var credentials = new SigningCredentials(GetSigningKey(), SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(_settings.AccessTokenExpiryMinutes);
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(AuthConstants.Claims.UserId, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(AuthConstants.Claims.TenantId, tenantId.ToString()),
            new Claim(AuthConstants.Claims.FirstName, user.FirstName),
            new Claim(AuthConstants.Claims.Plan, user.Plan),
            new Claim(
                AuthConstants.Claims.IsAdmin,
                (user.Role == AuthConstants.Roles.Admin).ToString().ToLowerInvariant()),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    public string GenerateRefreshTokenString()
    {
        return Convert.ToBase64String(System.Security.Cryptography.RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-", StringComparison.Ordinal)
            .Replace("/", "_", StringComparison.Ordinal)
            .Replace("=", string.Empty, StringComparison.Ordinal);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        try
        {
            return new JwtSecurityTokenHandler().ValidateToken(
                token,
                new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = _settings.Issuer,
                    ValidateAudience = true,
                    ValidAudience = _settings.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = GetSigningKey(),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                },
                out _);
        }
        catch (SecurityTokenException)
        {
            return null;
        }
        catch (ArgumentException)
        {
            return null;
        }
    }

    private SymmetricSecurityKey GetSigningKey()
    {
        if (string.IsNullOrWhiteSpace(_settings.Secret) || _settings.Secret.Length < 32)
            throw new InvalidOperationException("JWT secret must be at least 32 characters.");

        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Secret));
    }
}
