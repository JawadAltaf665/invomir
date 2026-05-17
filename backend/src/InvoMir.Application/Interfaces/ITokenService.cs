namespace InvoMir.Application.Interfaces;

public interface ITokenService
{
    string GenerateAccessToken(User user, Guid tenantId);
    string GenerateRefreshTokenString();
    ClaimsPrincipal? ValidateToken(string token);
}
