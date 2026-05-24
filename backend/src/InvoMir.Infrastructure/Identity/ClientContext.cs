namespace InvoMir.Infrastructure.Identity;

public sealed class ClientContext(IHttpContextAccessor httpContextAccessor) : IClientContext
{
    private const int MaxIpAddressLength = 50;
    private const int MaxDeviceInfoLength = 500;

    public string? IpAddress => ResolveIpAddress(httpContextAccessor.HttpContext);

    public string? DeviceInfo => ResolveDeviceInfo(httpContextAccessor.HttpContext);

    private static string? ResolveIpAddress(HttpContext? context)
    {
        if (context is null)
            return null;

        var request = context.Request;
        var candidate =
            FirstHeaderValue(request, "CF-Connecting-IP") ??
            FirstForwardedForAddress(request) ??
            FirstForwardedAddress(request) ??
            FirstHeaderValue(request, "X-Real-IP") ??
            context.Connection.RemoteIpAddress?.ToString();

        return Normalize(candidate, MaxIpAddressLength);
    }

    private static string? ResolveDeviceInfo(HttpContext? context)
    {
        var userAgent = context?.Request.Headers.UserAgent.ToString();
        if (string.IsNullOrWhiteSpace(userAgent))
            return null;

        var browser = userAgent.Contains("Edg/", StringComparison.OrdinalIgnoreCase)
            ? "Edge"
            : userAgent.Contains("Chrome/", StringComparison.OrdinalIgnoreCase)
                ? "Chrome"
                : userAgent.Contains("Firefox/", StringComparison.OrdinalIgnoreCase)
                    ? "Firefox"
                    : userAgent.Contains("Safari/", StringComparison.OrdinalIgnoreCase)
                        ? "Safari"
                        : "Browser";

        var platform = userAgent.Contains("Windows", StringComparison.OrdinalIgnoreCase)
            ? "Windows"
            : userAgent.Contains("Mac OS X", StringComparison.OrdinalIgnoreCase)
                ? "macOS"
                : userAgent.Contains("iPhone", StringComparison.OrdinalIgnoreCase)
                    ? "iPhone"
                    : userAgent.Contains("Android", StringComparison.OrdinalIgnoreCase)
                        ? "Android"
                        : userAgent.Contains("Linux", StringComparison.OrdinalIgnoreCase)
                            ? "Linux"
                            : "Unknown device";

        return Normalize($"{browser} - {platform}", MaxDeviceInfoLength);
    }

    private static string? FirstHeaderValue(HttpRequest request, string headerName)
    {
        var value = request.Headers[headerName].ToString();
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault();
    }

    private static string? FirstForwardedForAddress(HttpRequest request)
    {
        return FirstHeaderValue(request, "X-Forwarded-For");
    }

    private static string? FirstForwardedAddress(HttpRequest request)
    {
        var forwarded = FirstHeaderValue(request, "Forwarded");
        if (string.IsNullOrWhiteSpace(forwarded))
            return null;

        const string key = "for=";
        var forPart = forwarded
            .Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(part => part.StartsWith(key, StringComparison.OrdinalIgnoreCase));

        return forPart?[key.Length..].Trim('"', '[', ']');
    }

    private static string? Normalize(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var normalized = value.Trim();
        return normalized.Length <= maxLength
            ? normalized
            : normalized[..maxLength];
    }
}
