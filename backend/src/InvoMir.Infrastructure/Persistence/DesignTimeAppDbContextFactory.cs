namespace InvoMir.Infrastructure.Persistence;

public sealed class DesignTimeAppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = GetConnectionString();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new AppDbContext(options, new DesignTimeTenantContext(), new DesignTimeCurrentUserContext());
    }

    private static string GetConnectionString()
    {
        var environmentConnectionString = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings:DefaultConnection")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings:Default")
            ?? Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? TryBuildPostgresEnvironmentConnectionString();

        var connectionString = string.IsNullOrWhiteSpace(environmentConnectionString)
            ? GetConnectionStringFromAppSettings()
            : environmentConnectionString;

        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection, ConnectionStrings:Default, or DATABASE_URL is not configured for EF migrations.");

        return DatabaseConnectionStringResolver.NormalizePostgreSqlConnectionString(connectionString);
    }

    private static string? GetConnectionStringFromAppSettings()
    {
        var apiProjectPath = ResolveApiProjectPath();
        var connectionString = ReadConnectionString(Path.Combine(apiProjectPath, "appsettings.json"));
        var environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
        var environmentConnectionString = ReadConnectionString(
            Path.Combine(apiProjectPath, $"appsettings.{environment}.json"));

        return string.IsNullOrWhiteSpace(environmentConnectionString)
            ? connectionString
            : environmentConnectionString;
    }

    private static string ResolveApiProjectPath()
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        var repoRootPath = Path.Combine(currentDirectory, "backend", "src", "InvoMir.API", "InvoMir.API");
        if (Directory.Exists(repoRootPath))
            return repoRootPath;

        var directPath = Path.Combine(currentDirectory, "src", "InvoMir.API", "InvoMir.API");
        if (Directory.Exists(directPath))
            return directPath;

        var parentPath = Path.Combine(currentDirectory, "..", "InvoMir.API", "InvoMir.API");
        if (Directory.Exists(parentPath))
            return Path.GetFullPath(parentPath);

        var directory = new DirectoryInfo(currentDirectory);
        while (directory is not null)
        {
            var nestedPath = Path.Combine(directory.FullName, "backend", "src", "InvoMir.API", "InvoMir.API");
            if (Directory.Exists(nestedPath))
                return nestedPath;

            directory = directory.Parent;
        }

        return currentDirectory;
    }

    private static string? ReadConnectionString(string path)
    {
        if (!File.Exists(path))
            return null;

        using var stream = File.OpenRead(path);
        using var document = JsonDocument.Parse(stream);

        if (!document.RootElement.TryGetProperty("ConnectionStrings", out var connectionStrings))
            return null;

        if (connectionStrings.TryGetProperty("DefaultConnection", out var defaultConnection))
            return defaultConnection.GetString();

        return connectionStrings.TryGetProperty("Default", out var defaultRailwayConnection)
            ? defaultRailwayConnection.GetString()
            : null;
    }

    private static string? TryBuildPostgresEnvironmentConnectionString()
    {
        var host = Environment.GetEnvironmentVariable("PGHOST");
        var database = Environment.GetEnvironmentVariable("PGDATABASE");
        var username = Environment.GetEnvironmentVariable("PGUSER");

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(database) ||
            string.IsNullOrWhiteSpace(username))
        {
            return null;
        }

        var port = int.TryParse(Environment.GetEnvironmentVariable("PGPORT"), out var parsedPort)
            ? parsedPort
            : 5432;

        var builder = new Npgsql.NpgsqlConnectionStringBuilder
        {
            Host = host,
            Port = port,
            Database = database,
            Username = username,
            Password = Environment.GetEnvironmentVariable("PGPASSWORD") ?? string.Empty,
            SslMode = Npgsql.SslMode.Require,
            TrustServerCertificate = true
        };

        return builder.ConnectionString;
    }

    private sealed class DesignTimeTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
        public bool IsAuthenticated => false;
    }

    private sealed class DesignTimeCurrentUserContext : ICurrentUserContext
    {
        public Guid? UserId => null;
        public bool IsAuthenticated => false;
    }
}
