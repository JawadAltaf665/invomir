using Npgsql;

namespace InvoMir.Infrastructure.Settings;

public static class DatabaseConnectionStringResolver
{
    private const string PrimaryConnectionName = "DefaultConnection";
    private const string RailwayConnectionName = "Default";
    private const int DefaultPostgresPort = 5432;

    public static string GetRequiredDefaultConnectionString(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString(PrimaryConnectionName);
        connectionString = FirstConfigured(
            connectionString,
            configuration.GetConnectionString(RailwayConnectionName),
            configuration["DATABASE_URL"],
            BuildFromPostgresEnvironment(configuration));

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "PostgreSQL connection string is not configured. Set ConnectionStrings__DefaultConnection, ConnectionStrings__Default, or Railway DATABASE_URL.");
        }

        return NormalizePostgreSqlConnectionString(connectionString);
    }

    public static string NormalizePostgreSqlConnectionString(string connectionString)
    {
        if (LooksLikeSqlServerConnectionString(connectionString))
        {
            throw new InvalidOperationException(
                "The configured database connection string looks like SQL Server. InvoMir requires PostgreSQL/Npgsql.");
        }

        var trimmedConnectionString = connectionString.Trim();
        if (!Uri.TryCreate(trimmedConnectionString, UriKind.Absolute, out var uri) ||
            uri.Scheme is not ("postgres" or "postgresql"))
        {
            return trimmedConnectionString;
        }

        var userInfo = uri.UserInfo.Split(':', 2);
        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.Port > 0 ? uri.Port : DefaultPostgresPort,
            Database = uri.AbsolutePath.TrimStart('/'),
            Username = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : string.Empty,
            Password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty,
            SslMode = SslMode.Require
        };

        return builder.ConnectionString;
    }

    private static string? BuildFromPostgresEnvironment(IConfiguration configuration)
    {
        var host = configuration["PGHOST"];
        var database = configuration["PGDATABASE"];
        var username = configuration["PGUSER"];

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(database) ||
            string.IsNullOrWhiteSpace(username))
        {
            return null;
        }

        var port = int.TryParse(configuration["PGPORT"], out var parsedPort)
            ? parsedPort
            : DefaultPostgresPort;

        var builder = new NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = port,
            Database = database,
            Username = username,
            Password = configuration["PGPASSWORD"] ?? string.Empty,
            SslMode = SslMode.Require
        };

        return builder.ConnectionString;
    }

    private static string? FirstConfigured(params string?[] values)
    {
        return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));
    }

    private static bool LooksLikeSqlServerConnectionString(string connectionString)
    {
        return connectionString.Contains("TrustServerCertificate", StringComparison.OrdinalIgnoreCase)
            || connectionString.Contains("MultipleActiveResultSets", StringComparison.OrdinalIgnoreCase)
            || connectionString.Contains("User Id=sa", StringComparison.OrdinalIgnoreCase);
    }
}
