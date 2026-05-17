namespace InvoMir.Infrastructure.Identity;

public sealed class TenantContext(IHttpContextAccessor httpContextAccessor) : ITenantContext
{
    public Guid TenantId
    {
        get
        {
            var claim = httpContextAccessor.HttpContext?.User
                .FindFirst(AuthConstants.Claims.TenantId)
                ?.Value;

            if (string.IsNullOrWhiteSpace(claim) || !Guid.TryParse(claim, out var tenantId))
                throw new UnauthorizedAccessException("Tenant context is not available.");

            return tenantId;
        }
    }

    public bool IsAuthenticated =>
        httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;
}
