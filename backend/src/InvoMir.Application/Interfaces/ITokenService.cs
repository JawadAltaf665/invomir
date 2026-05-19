namespace InvoMir.Application.Interfaces;

public interface ITokenService
{
    (string Token, DateTime ExpiresAt, IReadOnlyCollection<string> Permissions) GenerateAccessToken(User user, Guid tenantId);
    string GenerateRefreshTokenString();
    ClaimsPrincipal? ValidateToken(string token);
}
