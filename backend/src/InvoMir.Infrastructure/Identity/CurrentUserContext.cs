namespace InvoMir.Infrastructure.Identity;

public sealed class CurrentUserContext(IHttpContextAccessor httpContextAccessor) : ICurrentUserContext
{
    public Guid? UserId
    {
        get
        {
            var claim = httpContextAccessor.HttpContext?.User.FindFirst(AuthConstants.Claims.UserId)?.Value
                ?? httpContextAccessor.HttpContext?.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? httpContextAccessor.HttpContext?.User.FindFirst(AuthConstants.Claims.Subject)?.Value;

            return Guid.TryParse(claim, out var userId) ? userId : null;
        }
    }

    public bool IsAuthenticated =>
        httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
