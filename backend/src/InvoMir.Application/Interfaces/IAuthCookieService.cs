namespace InvoMir.Application.Interfaces;

public interface IAuthCookieService
{
    string? GetRefreshToken();
    void SetRefreshToken(string token, DateTime expiresAt);
    void ClearRefreshToken();
}
