namespace InvoMir.Infrastructure.Identity;

public sealed class ClientContext(IHttpContextAccessor httpContextAccessor) : IClientContext
{
    public string? IpAddress =>
        httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString();

    public string? DeviceInfo =>
        httpContextAccessor.HttpContext?.Request.Headers.UserAgent.ToString();
}
