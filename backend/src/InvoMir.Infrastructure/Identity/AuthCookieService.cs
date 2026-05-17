namespace InvoMir.Infrastructure.Identity;

public sealed class AuthCookieService(IHttpContextAccessor httpContextAccessor) : IAuthCookieService
{
    public string? GetRefreshToken()
    {
        return httpContextAccessor.HttpContext?.Request.Cookies[AuthConstants.RefreshTokenCookieName];
    }

    public void SetRefreshToken(string token, DateTime expiresAt)
    {
        httpContextAccessor.HttpContext?.Response.Cookies.Append(
            AuthConstants.RefreshTokenCookieName,
            token,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Path = "/",
                Expires = expiresAt
            });
    }

    public void ClearRefreshToken()
    {
        httpContextAccessor.HttpContext?.Response.Cookies.Delete(
            AuthConstants.RefreshTokenCookieName,
            new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict,
                Path = "/"
            });
    }
}
