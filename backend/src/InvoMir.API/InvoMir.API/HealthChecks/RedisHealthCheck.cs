using System.Net.Sockets;
using System.Text;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace InvoMir.API.HealthChecks;

public sealed class RedisHealthCheck(IConfiguration configuration) : IHealthCheck
{
    private const int DefaultRedisPort = 6379;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var connectionString = configuration.GetConnectionString("Redis")
            ?? configuration["REDIS_URL"]
            ?? configuration["Redis:Url"];
        if (string.IsNullOrWhiteSpace(connectionString))
            return HealthCheckResult.Unhealthy("Redis connection string is not configured.");

        var endpoint = TryParseEndpoint(connectionString);
        if (endpoint is null)
            return HealthCheckResult.Unhealthy("Redis connection string endpoint is invalid.");

        try
        {
            using var client = new TcpClient();
            await client.ConnectAsync(endpoint.Value.Host, endpoint.Value.Port, cancellationToken);
            var stream = client.GetStream();

            if (!string.IsNullOrWhiteSpace(endpoint.Value.Password))
            {
                var authCommand = string.IsNullOrWhiteSpace(endpoint.Value.UserName)
                    ? BuildRedisCommand("AUTH", endpoint.Value.Password)
                    : BuildRedisCommand("AUTH", endpoint.Value.UserName, endpoint.Value.Password);

                await stream.WriteAsync(authCommand, cancellationToken);
                var authResponse = await ReadRedisResponseAsync(stream, cancellationToken);
                if (!authResponse.StartsWith("+OK", StringComparison.Ordinal))
                    return HealthCheckResult.Unhealthy("Redis authentication failed.");
            }

            await stream.WriteAsync(BuildRedisCommand("PING"), cancellationToken);
            var pingResponse = await ReadRedisResponseAsync(stream, cancellationToken);

            return pingResponse.StartsWith("+PONG", StringComparison.Ordinal)
                ? HealthCheckResult.Healthy("Redis is reachable.")
                : HealthCheckResult.Unhealthy("Redis ping failed.");
        }
        catch (SocketException)
        {
            return HealthCheckResult.Unhealthy("Redis is not reachable.");
        }
        catch (TimeoutException)
        {
            return HealthCheckResult.Unhealthy("Redis connection timed out.");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("Redis connection timed out.");
        }
    }

    private static RedisEndpoint? TryParseEndpoint(string connectionString)
    {
        var trimmedConnectionString = connectionString.Trim();
        if (Uri.TryCreate(trimmedConnectionString, UriKind.Absolute, out var redisUri) &&
            (redisUri.Scheme == "redis" || redisUri.Scheme == "rediss"))
        {
            return new RedisEndpoint(
                redisUri.Host,
                redisUri.Port > 0 ? redisUri.Port : DefaultRedisPort,
                TryReadUserName(redisUri),
                TryReadPassword(redisUri));
        }

        var parts = trimmedConnectionString
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToArray();
        var endpointPart = parts.FirstOrDefault();

        if (string.IsNullOrWhiteSpace(endpointPart))
            return null;

        string? userName = null;
        string? password = null;
        var passwordSeparatorIndex = endpointPart.LastIndexOf('@');
        if (passwordSeparatorIndex >= 0 && passwordSeparatorIndex < endpointPart.Length - 1)
        {
            var credentials = endpointPart[..passwordSeparatorIndex].Split(':', 2);
            if (credentials.Length == 2)
            {
                userName = credentials[0];
                password = credentials[1];
            }
            else if (credentials.Length == 1)
            {
                password = credentials[0];
            }

            endpointPart = endpointPart[(passwordSeparatorIndex + 1)..];
        }

        var hostPort = endpointPart.Split(':', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (hostPort.Length == 0 || string.IsNullOrWhiteSpace(hostPort[0]))
            return null;

        var port = DefaultRedisPort;
        if (hostPort.Length > 1 && !int.TryParse(hostPort[1], out port))
            return null;

        password ??= parts
            .Skip(1)
            .Select(part => part.Split('=', 2, StringSplitOptions.TrimEntries))
            .Where(part => part.Length == 2 && part[0].Equals("password", StringComparison.OrdinalIgnoreCase))
            .Select(part => part[1])
            .FirstOrDefault();

        return new RedisEndpoint(hostPort[0], port, userName, password);
    }

    private static string? TryReadUserName(Uri uri)
    {
        if (string.IsNullOrWhiteSpace(uri.UserInfo))
            return null;

        var parts = uri.UserInfo.Split(':', 2);
        return parts.Length == 2
            ? Uri.UnescapeDataString(parts[0])
            : null;
    }

    private static string? TryReadPassword(Uri uri)
    {
        if (string.IsNullOrWhiteSpace(uri.UserInfo))
            return null;

        var parts = uri.UserInfo.Split(':', 2);
        return parts.Length == 2
            ? Uri.UnescapeDataString(parts[1])
            : Uri.UnescapeDataString(parts[0]);
    }

    private static byte[] BuildRedisCommand(params string[] arguments)
    {
        var builder = new StringBuilder();
        builder.Append('*').Append(arguments.Length).Append("\r\n");

        foreach (var argument in arguments)
        {
            builder
                .Append('$')
                .Append(Encoding.UTF8.GetByteCount(argument))
                .Append("\r\n")
                .Append(argument)
                .Append("\r\n");
        }

        return Encoding.UTF8.GetBytes(builder.ToString());
    }

    private static async Task<string> ReadRedisResponseAsync(
        NetworkStream stream,
        CancellationToken cancellationToken)
    {
        var buffer = new byte[512];
        var bytesRead = await stream.ReadAsync(buffer, cancellationToken);

        return bytesRead == 0
            ? string.Empty
            : Encoding.UTF8.GetString(buffer, 0, bytesRead);
    }

    private readonly record struct RedisEndpoint(
        string Host,
        int Port,
        string? UserName,
        string? Password);
}
