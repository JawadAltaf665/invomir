using Hangfire.Dashboard;
using System.Net;

namespace InvoMir.API.Authorization;

public sealed class HangfireDashboardAuthorizationFilter(
    IWebHostEnvironment environment)
    : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();

        if (environment.IsDevelopment() && IsLocalRequest(httpContext))
            return true;

        var user = httpContext.User;

        return user.Identity?.IsAuthenticated == true &&
            (user.HasClaim(AuthConstants.Claims.Permission, Permissions.System.Access) ||
                user.HasClaim(AuthConstants.Claims.Role, AuthConstants.Roles.SystemAdmin) ||
                user.IsInRole(AuthConstants.Roles.SystemAdmin));
    }

    private static bool IsLocalRequest(HttpContext context)
    {
        var remoteIp = context.Connection.RemoteIpAddress;
        var localIp = context.Connection.LocalIpAddress;

        if (remoteIp is null)
            return false;

        if (IPAddress.IsLoopback(remoteIp))
            return true;

        return localIp is not null && remoteIp.Equals(localIp);
    }
}
